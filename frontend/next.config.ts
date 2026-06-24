import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.join(frontendRoot, "..");
const apiUrl = process.env.API_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  transpilePackages: ["@acme/shared"],
  turbopack: {
    root: monorepoRoot,
  },
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
