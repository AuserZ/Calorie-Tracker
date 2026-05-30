import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
    ],
  },
  async rewrites() {
    return [
      // Serve meal images via the streaming API handler.
      // This way the URL stays /meals/<filename> regardless of where
      // MEALS_DIR points on disk.
      { source: "/meals/:filename", destination: "/api/meals/:filename" },
    ];
  },
};

export default nextConfig;
