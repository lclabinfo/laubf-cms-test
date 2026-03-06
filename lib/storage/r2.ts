import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;

export const ATTACHMENTS_BUCKET = process.env.R2_ATTACHMENTS_BUCKET_NAME!;
export const PUBLIC_URL = (process.env.R2_ATTACHMENTS_PUBLIC_URL || process.env.R2_PUBLIC_URL || "").replace(/\/+$/, "");

// ---------------------------------------------------------------------------
// S3-compatible client (singleton)
// ---------------------------------------------------------------------------

const client = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate a presigned PUT URL for direct browser uploads.
 * Default expiration: 1 hour (3600 seconds).
 */
export async function getUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: ATTACHMENTS_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Delete an object from a bucket.
 */
export async function deleteObject(
  key: string,
  bucket = ATTACHMENTS_BUCKET,
): Promise<void> {
  await client.send(
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
 * Move (copy + delete) an object within a bucket.
 * Used to promote files from staging/ to their permanent key.
 */
export async function moveObject(
  srcKey: string,
  destKey: string,
  bucket = ATTACHMENTS_BUCKET,
): Promise<void> {
  await client.send(
    new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${srcKey}`,
      Key: destKey,
    }),
  );
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: srcKey,
    }),
  );
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
 * Upload a file from the server side (e.g. migration scripts).
 */
export async function uploadFile(
  key: string,
  body: Buffer | ReadableStream,
  contentType: string,
  bucket = ATTACHMENTS_BUCKET,
): Promise<void> {
  await client.send(
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
    const response = await client.send(
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
