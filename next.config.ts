import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow dev server access from local network
  allowedDevOrigins: ["192.168.178.250"],
};

export default nextConfig;
