import type { NextConfig } from "next";

/**
 * Subdomain → /website rewrite (replaces middleware).
 *
 * On church subdomains (e.g. laubf.lclab.io), every public path is
 * transparently rewritten to /website/… so the browser URL stays clean.
 * In development (localhost) the rewrites don't apply — devs navigate
 * to /website/… directly as before.
 */
const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000')
  .replace(/:\d+$/, '') // strip port

const isLocalDev = rootDomain === 'localhost' || rootDomain === '127.0.0.1'

// Escaped domain for regex (e.g. "lclab\\.io")
const escapedDomain = rootDomain.replace(/\./g, '\\.')
// Match any subdomain of ROOT_DOMAIN except admin.*
const hostPattern = `(?!admin\\.)(.+)\\.${escapedDomain}`

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
  async rewrites() {
    // No subdomain rewrites needed in local dev
    if (isLocalDev) return []

    return {
      beforeFiles: [
        // Root path → website homepage
        {
          source: '/',
          destination: '/website',
          has: [{ type: 'host', value: hostPattern }],
        },
        // All other paths (skip _next, api, favicon)
        {
          source: '/:path((?!_next|api|favicon\\.ico).*)',
          destination: '/website/:path',
          has: [{ type: 'host', value: hostPattern }],
        },
      ],
    }
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
