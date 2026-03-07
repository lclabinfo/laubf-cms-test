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
      // Media bucket R2 dev URL
      {
        protocol: "https",
        hostname: "pub-91add7d8455848c9a871477af3249f9e.r2.dev",
      },
    ],
  },
};

export default nextConfig;
