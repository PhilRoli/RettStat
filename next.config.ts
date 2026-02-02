import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n.ts");

const nextConfig: NextConfig = {
  // Allow dev server access from local network
  allowedDevOrigins: ["192.168.178.250"],
};

export default withNextIntl(nextConfig);
