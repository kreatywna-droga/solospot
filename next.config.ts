import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // headers removed to fix VS Code Simple Browser white screen issues
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
