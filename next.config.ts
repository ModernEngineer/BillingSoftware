import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5215";

const nextConfig: NextConfig = {
  // The .NET Core + SQL Server backend (backend/BillingErp.Api) now owns every /api/* route —
  // this proxies requests to it server-side so the browser only ever talks to this Next.js
  // origin (the billing_session cookie set by the backend's login endpoint flows through
  // untouched in both directions; no CORS config needed).
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
