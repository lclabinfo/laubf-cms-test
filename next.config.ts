import type { NextConfig } from "next";

/**
 * Subdomain → /website routing is handled by proxy.ts (Next.js 16 file convention).
 * See docs/04_proxy-routing/proxy-routing-architecture.md for full details.
 *
 * Do NOT add beforeFiles rewrites for subdomain routing here — they conflict
 * with the proxy and cause double-rewriting (/website/website/...).
 */

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner', 'typescript'],
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      'motion',
      '@tiptap/core',
      '@tiptap/pm',
    ],
    serverSourceMaps: false,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // Attachments bucket R2 dev URL
      {
        protocol: "https",
        hostname: "pub-59a92027daa648c8a02f226cb5873645.r2.dev",
      },
      // Media bucket R2 dev URL
      {
        protocol: "https",
        hostname: "pub-91add7d8455848c9a871477af3249f9e.r2.dev",
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
