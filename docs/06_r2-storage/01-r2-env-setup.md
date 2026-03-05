# Cloudflare R2 — Environment Setup

## Required Environment Variables

| Variable | Purpose | Where to find |
|---|---|---|
| `R2_ACCOUNT_ID` | Cloudflare account identifier | Cloudflare dashboard > Account Home > right sidebar |
| `R2_ACCESS_KEY_ID` | S3-compatible API token access key | Cloudflare > R2 > Manage R2 API Tokens > Create |
| `R2_SECRET_ACCESS_KEY` | S3-compatible API token secret | Shown once at token creation — save immediately |
| `R2_BUCKET_NAME` | Name of the R2 bucket | Cloudflare > R2 > Create Bucket (e.g., `digitalchurch-media`) |
| `R2_PUBLIC_URL` | Public URL for serving files | Custom domain on R2 bucket (e.g., `https://cdn.laubf.org`) or R2 dev URL |

## Endpoint

The S3-compatible endpoint is:
```
https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com
```

## NPM Packages

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## S3Client Configuration

```ts
import { S3Client } from "@aws-sdk/client-s3"

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})
```

## R2 Bucket CORS Configuration

Set this in Cloudflare dashboard > R2 > Bucket > Settings > CORS:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://your-domain.com"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

## Next.js Config

Add the CDN domain to `next.config.ts` remote patterns so `<Image>` can load R2-hosted files:

```ts
images: {
  remotePatterns: [
    { protocol: "https", hostname: "cdn.laubf.org" },
    // or the R2 dev URL:
    { protocol: "https", hostname: "pub-XXXX.r2.dev" },
  ],
}
```
