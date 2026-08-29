import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployments
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fal.media",
      },
      {
        protocol: "https",
        hostname: "*.fal.media",
      },
      {
        protocol: "https",
        hostname: "v3.fal.media",
      },
      {
        protocol: "https",
        hostname: "v3b.fal.media",
      },
      {
        protocol: "https",
        hostname: "ai-statics.freepik.com",
      },
      {
        protocol: "https",
        hostname: "cdn-magnific.freepik.com",
      },
      {
        protocol: "https",
        hostname: "*.freepik.com",
      },
    ],
  },
};

export default nextConfig;
