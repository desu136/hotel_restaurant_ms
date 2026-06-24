import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Point to the monorepo workspace root so turbopack finds node_modules correctly
    root: path.resolve(__dirname, '..'),
  },
  // Allow LAN devices (phones, tablets, other PCs) to access the dev server
  allowedDevOrigins: [
    '192.168.1.3',
    'http://192.168.1.104:3000',
    'http://192.168.1.104',
  ],
};

export default nextConfig;
