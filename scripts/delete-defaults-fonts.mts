import 'dotenv/config'
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const MEDIA_BUCKET = process.env.R2_MEDIA_BUCKET_NAME!

// List all objects under defaults/fonts/
const objects: { key: string; size: number }[] = []
let token: string | undefined
do {
  const res = await s3.send(new ListObjectsV2Command({ Bucket: MEDIA_BUCKET, Prefix: 'defaults/fonts/', ContinuationToken: token }))
  for (const obj of res.Contents ?? []) {
    if (obj.Key && obj.Size !== undefined) objects.push({ key: obj.Key, size: obj.Size })
  }
  token = res.IsTruncated ? res.NextContinuationToken : undefined
} while (token)

console.log(`Found ${objects.length} files under defaults/fonts/`)
for (const o of objects) console.log(`  ${o.key}  (${(o.size / 1024).toFixed(1)} KB)`)

if (objects.length === 0) {
  console.log('Nothing to delete.')
  process.exit(0)
}

// Delete them
await s3.send(new DeleteObjectsCommand({
  Bucket: MEDIA_BUCKET,
  Delete: { Objects: objects.map(o => ({ Key: o.key })) },
}))

const totalKB = objects.reduce((s, o) => s + o.size, 0) / 1024
console.log(`\nDeleted ${objects.length} files (${(totalKB / 1024).toFixed(1)} MB) from defaults/fonts/`)
