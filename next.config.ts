import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "aussievapemart.com.au",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
};

export default nextConfig;
