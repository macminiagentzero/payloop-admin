import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    // Force fresh build for dynamic routes
  },
};

export default nextConfig;