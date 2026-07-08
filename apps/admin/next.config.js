import path from "node:path";
import { fileURLToPath } from "node:url";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(configDir, "../..");
const backendProxyUrl = (process.env.BACKEND_PROXY_URL || "https://backend.nexgencrypto.live").replace(/\/+$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: repoRoot,
  turbopack: {
    root: repoRoot,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendProxyUrl}/api/:path*`,
      },
      {
        source: "/socket.io/:path*",
        destination: `${backendProxyUrl}/socket.io/:path*`,
      },
    ];
  },
};

export default nextConfig;
