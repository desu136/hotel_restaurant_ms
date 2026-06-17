import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Point to the monorepo workspace root so turbopack finds node_modules correctly
    root: path.resolve(__dirname, '..'),
  },
  // Allow LAN devices (phones, tablets, other PCs) to access the dev server
  allowedDevOrigins: [
    '192.168.1.76',
    '192.168.1.*',
  ],
};

export default nextConfig;
