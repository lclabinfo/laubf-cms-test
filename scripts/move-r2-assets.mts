/**
 * Move all objects from laubf/initial-setup/ → la-ubf/initial-setup/
 * in the R2 media bucket, then delete the originals.
 *
 * Usage: npx tsx scripts/move-r2-assets.mts
 */
import 'dotenv/config';
import {
  S3Client,
  CopyObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const BUCKET = process.env.R2_MEDIA_BUCKET_NAME!;

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const OLD_PREFIX = 'laubf/initial-setup/';
const NEW_PREFIX = 'la-ubf/initial-setup/';

async function main() {
  let moved = 0;
  let continuationToken: string | undefined;

  do {
    const list = await client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: OLD_PREFIX,
        ContinuationToken: continuationToken,
      }),
    );

    for (const obj of list.Contents ?? []) {
      if (!obj.Key) continue;
      const newKey = obj.Key.replace(OLD_PREFIX, NEW_PREFIX);

      // Copy to new location
      await client.send(
        new CopyObjectCommand({
          Bucket: BUCKET,
          CopySource: `${BUCKET}/${obj.Key}`,
          Key: newKey,
        }),
      );

      // Delete old
      await client.send(
        new DeleteObjectCommand({ Bucket: BUCKET, Key: obj.Key }),
      );

      console.log(`✅ ${obj.Key} → ${newKey}`);
      moved++;
    }

    continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (continuationToken);

  console.log(`\nDone! Moved ${moved} objects.`);
}

main().catch(console.error);
