import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  onDemandEntries: {
    // Keep pages in memory for less time to reduce RAM usage
    maxInactiveAge: 10 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;
