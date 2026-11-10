import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "Cross-Origin-Resource-Policy", value: "same-origin" }],
      },
    ];
  },
};

export default nextConfig;
