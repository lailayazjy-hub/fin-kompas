import type { NextConfig } from "next";
import withPWAInit from "next-pwa";
import runtimeCaching from "next-pwa/cache";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  dynamicStartUrl: true,
  runtimeCaching,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withPWA(nextConfig);
