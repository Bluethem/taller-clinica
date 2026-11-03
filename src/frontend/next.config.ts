import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        source: "/seguridad/:path*",
        destination: "http://localhost:3001/seguridad/:path*",
      },
      {
        source: "/auth/:path*",
        destination: "http://localhost:3001/auth/:path*",
      },
      {
        source: "/agenda/:path*",
        destination: "http://localhost:3001/agenda/:path*",
      },
      {
        source: "/laboratorio/:path*",
        destination: "http://localhost:3001/laboratorio/:path*",
      },
      {
        source: "/facturacion/:path*",
        destination: "http://localhost:3001/facturacion/:path*",
      },
      {
        source: "/historia/:path*",
        destination: "http://localhost:3001/historia/:path*",
      },
      {
        source: "/pacientes-api/:path*",
        destination: "http://localhost:3001/pacientes/:path*",
      },
    ];
  },
};

export default nextConfig;
