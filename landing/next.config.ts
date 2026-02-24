import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  env: {
    // Unique per build — used as cache-buster query param for static assets
    NEXT_PUBLIC_BUILD_ID: Date.now().toString(),
  },
};

export default nextConfig;
