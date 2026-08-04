import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allows Next.js to transpile our workspace packages, which are consumed
  // directly from TypeScript source (no separate build step in development).
  transpilePackages: ["@isociety/shared"],
};

export default nextConfig;
