import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // headers removed to fix VS Code Simple Browser white screen issues
  // G1-331: typescript.ignoreBuildErrors removed — production build must surface
  // type errors instead of silently shipping broken code. CI guard.
};

export default nextConfig;
