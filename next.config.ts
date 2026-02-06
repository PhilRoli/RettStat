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

  // Proxy PocketBase API requests to hide the backend URL from the browser
  // POCKETBASE_URL is a server-only runtime var (not inlined at build like NEXT_PUBLIC_*)
  async rewrites() {
    const pbUrl =
      process.env.POCKETBASE_URL ||
      process.env.NEXT_PUBLIC_POCKETBASE_URL ||
      "http://127.0.0.1:8090";
    return [{ source: "/pb/:path*", destination: `${pbUrl}/:path*` }];
  },
};

export default withNextIntl(nextConfig);
