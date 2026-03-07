import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
      // Media bucket R2 dev URL — update hostname after creating the file-media bucket in Cloudflare
      // { protocol: "https", hostname: "pub-MEDIA-BUCKET-ID.r2.dev" },
    ],
  },
};

export default nextConfig;
