import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Point to the monorepo workspace root so turbopack finds node_modules correctly
    root: path.resolve(__dirname, '..'),
  },
  // Allow ANY LAN device to access the dev server without needing to update IP each time.
  // This covers 192.168.x.x, 10.x.x.x, and 172.16-31.x.x subnets (all private IP ranges).
  allowedDevOrigins: [
    // Current active IPs
    '192.168.1.98',
    '192.168.1.13',
    '10.167.172.97',
    // Wildcard for any 192.168.x.x device
    '192.168.1.0/24',
    '192.168.0.0/24',
    // Wildcard for any 10.x.x.x device
    '10.167.172.0/24',
  ],
};

export default nextConfig;
