import 'dotenv/config'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! },
})

let ct: string | undefined
const keys: string[] = []
do {
  const r = await s3.send(new ListObjectsV2Command({
    Bucket: process.env.R2_MEDIA_BUCKET_NAME!,
    Prefix: 'la-ubf/initial-setup/',
    ContinuationToken: ct,
  }))
  for (const o of r.Contents ?? []) if (o.Key) keys.push(o.Key)
  ct = r.IsTruncated ? r.NextContinuationToken : undefined
} while (ct)

// Check all are flat (no subdirectories after prefix)
const prefix = 'la-ubf/initial-setup/'
for (const k of keys.sort()) {
  const rel = k.slice(prefix.length)
  const isFlat = !rel.includes('/')
  console.log(`${isFlat ? '✓' : '✗'} ${rel}`)
}
console.log(`\nTotal: ${keys.length}`)
