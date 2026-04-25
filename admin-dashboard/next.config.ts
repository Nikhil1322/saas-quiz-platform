import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok.io",
    "*.ngrok.dev",
    "192.168.1.71",
  ],
  async rewrites() {
    return [
      // Proxy /uploads/* directly from the backend (for images stored on disk)
      {
        source: "/uploads/:path*",
        destination: "http://localhost:5000/uploads/:path*",
      },
      // Proxy /api/img/* — alias for old stored image URLs
      {
        source: "/api/img/:path*",
        destination: "http://localhost:5000/api/img/:path*",
      },
      // Proxy all other /api/* to the backend
      {
        source: "/api/:path*",
        destination: "http://localhost:5000/api/:path*",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "ngrok-skip-browser-warning", value: "true" },
        ],
      },
    ];
  },
};

export default nextConfig;
