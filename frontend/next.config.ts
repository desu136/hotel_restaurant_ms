import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Point to the monorepo workspace root so turbopack finds node_modules correctly
    root: path.resolve(__dirname, '..'),
  },
};

export default nextConfig;
