import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;

export const ATTACHMENTS_BUCKET = process.env.R2_ATTACHMENTS_BUCKET_NAME!;
export const PUBLIC_URL = (process.env.R2_ATTACHMENTS_PUBLIC_URL || process.env.R2_PUBLIC_URL || "").replace(/\/+$/, "");

export const MEDIA_BUCKET = process.env.R2_MEDIA_BUCKET_NAME!;
export const MEDIA_PUBLIC_URL = (process.env.R2_MEDIA_PUBLIC_URL || "").replace(/\/+$/, "");

// ---------------------------------------------------------------------------
// S3-compatible client (lazy singleton — created on first use)
// ---------------------------------------------------------------------------

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: "auto",
      endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return _client;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate a presigned PUT URL for direct browser uploads.
 * Default expiration: 1 hour (3600 seconds).
 *
 * When `fileSize` is provided the presigned URL includes a ContentLength
 * constraint — R2 will reject uploads whose body size doesn't match, which
 * prevents a client from declaring a small size to pass validation but
 * uploading a much larger file.
 */
export async function getUploadUrl(
  key: string,
  contentType: string,
  fileSize?: number,
  opts?: { expiresIn?: number; bucket?: string },
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: opts?.bucket || ATTACHMENTS_BUCKET,
    Key: key,
    ContentType: contentType,
    ...(fileSize != null && { ContentLength: fileSize }),
  });
  return getSignedUrl(getClient(), command, { expiresIn: opts?.expiresIn ?? 3600 });
}

/**
 * Delete an object from a bucket.
 */
export async function deleteObject(
  key: string,
  bucket = ATTACHMENTS_BUCKET,
): Promise<void> {
  await getClient().send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}

/**
 * Return the public URL for an object.
 */
export function getPublicUrl(key: string): string {
  return `${PUBLIC_URL}/${key}`;
}

/**
 * Move an object within a bucket by downloading and re-uploading it.
 *
 * Previously used CopyObjectCommand, but Cloudflare R2 has known
 * compatibility issues with the AWS SDK v3 CopyObject operation —
 * the copy can silently fail while the subsequent delete succeeds,
 * permanently losing the file. This download-reupload approach is
 * reliable with R2 and includes verification before deleting the source.
 */
export async function moveObject(
  srcKey: string,
  destKey: string,
  bucket = ATTACHMENTS_BUCKET,
  contentDisposition?: string,
): Promise<void> {
  // 1. Download the source object
  const getResponse = await getClient().send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: srcKey,
    }),
  );

  if (!getResponse.Body) {
    throw new Error(`moveObject: source object ${srcKey} has no body`);
  }

  // Read the full body into a buffer
  const bodyBytes = await getResponse.Body.transformToByteArray();

  // 2. Upload to the destination key.
  // Use explicit contentDisposition if provided, otherwise preserve the source's value.
  const finalDisposition = contentDisposition || getResponse.ContentDisposition;
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: destKey,
      Body: bodyBytes,
      ContentType: getResponse.ContentType,
      ...(finalDisposition && { ContentDisposition: finalDisposition }),
    }),
  );

  // 3. Verify the destination exists before deleting the source.
  // R2 can have eventual consistency — retry HeadObject up to 3 times with backoff.
  let verified = false;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const headResponse = await getClient().send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: destKey,
        }),
      );
      if (headResponse.ContentLength && headResponse.ContentLength > 0) {
        verified = true;
        break;
      }
    } catch {
      // HeadObject may 404 briefly due to eventual consistency
    }
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }

  if (!verified) {
    throw new Error(
      `moveObject: destination object ${destKey} verification failed after 3 attempts — aborting delete of source`,
    );
  }

  // 4. Safe to delete the source
  await getClient().send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: srcKey,
    }),
  );
}

/**
 * Build a Content-Disposition header value from an original filename.
 * Uses RFC 5987 encoding for non-ASCII filenames.
 */
export function buildContentDisposition(filename: string): string {
  const safeFilename = filename.replace(/[\r\n"]/g, '_');
  const encodedFilename = encodeURIComponent(filename).replace(/'/g, '%27');
  return `inline; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`;
}

/**
 * Check if an R2 key is in the staging prefix.
 */
export function isStagingKey(key: string): boolean {
  // Key format: {churchSlug}/staging/{uuid}-{filename}
  return /^[^/]+\/staging\//.test(key);
}

/**
 * Derive the R2 object key from a full public URL.
 * Returns null if the URL doesn't match the public URL prefix.
 */
export function keyFromUrl(url: string): string | null {
  if (!PUBLIC_URL || !url.startsWith(PUBLIC_URL)) return null;
  return url.slice(PUBLIC_URL.length + 1); // +1 for trailing "/"
}

/**
 * Return the public URL for a media-bucket object.
 */
export function getMediaPublicUrl(key: string): string {
  return `${MEDIA_PUBLIC_URL}/${key}`;
}

/**
 * Derive the R2 object key from a full media-bucket public URL.
 * Returns null if the URL doesn't match the media public URL prefix.
 */
export function keyFromMediaUrl(url: string): string | null {
  if (!MEDIA_PUBLIC_URL || !url.startsWith(MEDIA_PUBLIC_URL)) return null;
  return url.slice(MEDIA_PUBLIC_URL.length + 1);
}

/**
 * Upload a file from the server side (e.g. migration scripts).
 */
export async function uploadFile(
  key: string,
  body: Buffer | ReadableStream,
  contentType: string,
  bucket = ATTACHMENTS_BUCKET,
): Promise<void> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

/**
 * List objects under a given prefix. Yields `{ key, size }` for each object,
 * automatically paginating through all results.
 */
export async function* listObjects(
  prefix: string,
  bucket = ATTACHMENTS_BUCKET,
): AsyncGenerator<{ key: string; size: number }> {
  let continuationToken: string | undefined;

  do {
    const response = await getClient().send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );

    for (const obj of response.Contents ?? []) {
      if (obj.Key && obj.Size !== undefined) {
        yield { key: obj.Key, size: obj.Size };
      }
    }

    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : undefined;
  } while (continuationToken);
}
