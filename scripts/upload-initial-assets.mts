/**
 * Upload all website assets from /public to R2 media bucket
 * under the key prefix: laubf/initial-setup/
 *
 * Usage: npx tsx scripts/upload-initial-assets.mts
 */
import 'dotenv/config';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { readFile, readdir, stat } from 'fs/promises';
import { join, extname } from 'path';

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const BUCKET = process.env.R2_MEDIA_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_MEDIA_PUBLIC_URL!.replace(/\/+$/, '');

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

const ROOT = join(import.meta.dirname, '..');
const PREFIX = 'laubf/initial-setup';

// Directories to upload (relative to public/)
const DIRS = [
  'images/compressed',
  'videos',
  'logo',
  'pics-temp',
];

async function walkDir(dir: string, base = ''): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...await walkDir(join(dir, entry.name), rel));
    } else {
      files.push(rel);
    }
  }
  return files;
}

async function exists(key: string): Promise<boolean> {
  try {
    await client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  let uploaded = 0;
  let skipped = 0;
  let errors = 0;

  for (const dir of DIRS) {
    const fullDir = join(ROOT, 'public', dir);
    const files = await walkDir(fullDir);

    for (const file of files) {
      const ext = extname(file).toLowerCase();
      const contentType = MIME_MAP[ext];
      if (!contentType) {
        console.log(`⏭  Skipping unknown type: ${dir}/${file}`);
        skipped++;
        continue;
      }

      const key = `${PREFIX}/${dir}/${file}`;

      // Check if already uploaded
      if (await exists(key)) {
        console.log(`✓  Already exists: ${key}`);
        skipped++;
        continue;
      }

      const localPath = join(fullDir, file);
      const body = await readFile(localPath);

      try {
        await client.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: body,
          ContentType: contentType,
          CacheControl: 'public, max-age=31536000, immutable',
        }));
        console.log(`✅ Uploaded: ${key} (${(body.length / 1024).toFixed(0)} KB)`);
        uploaded++;
      } catch (err) {
        console.error(`❌ Failed: ${key}`, err);
        errors++;
      }
    }
  }

  console.log(`\nDone! Uploaded: ${uploaded}, Skipped: ${skipped}, Errors: ${errors}`);
  console.log(`\nPublic URL prefix: ${PUBLIC_URL}/${PREFIX}/`);
}

main().catch(console.error);
