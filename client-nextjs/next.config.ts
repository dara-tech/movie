import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove static export to enable SSR
  // output: 'export',
  images: {
    unoptimized: true
  }
};

export default nextConfig;
