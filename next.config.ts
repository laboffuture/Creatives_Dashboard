import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Produce a self-contained build for self-hosting: `.next/standalone/server.js`.
  output: "standalone",
  // Pin the file-tracing root to this project so a stray lockfile in the
  // home directory can't be inferred as the workspace root.
  outputFileTracingRoot: path.join(__dirname),
  // Baseline security headers for all responses.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
