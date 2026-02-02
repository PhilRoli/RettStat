import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n.ts");

const nextConfig: NextConfig = {
  // Allow dev server access from local network
  allowedDevOrigins: ["192.168.178.250"],

  // Enable standalone output for Docker
  output: "standalone",

  // Disable experimental features that may not work with Bun
  experimental: {
    // Disable worker threads to avoid Bun compatibility issues
    webpackBuildWorker: false,
  },
};

export default withNextIntl(nextConfig);
