import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Engine runs server-side only in this phase
  serverExternalPackages: [
    "got-scraping",
    "header-generator",
    "got",
    "got-cjs",
    "http2-wrapper",
  ],
};

export default nextConfig;
