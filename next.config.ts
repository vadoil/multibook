import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    // Keep native image processing within the preview server's memory budget.
    imgOptConcurrency: 1,
    imgOptOperationCache: false,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "static.tildacdn.com" },
      { protocol: "https", hostname: "optim.tildacdn.com" },
    ],
  },
};

export default nextConfig;
