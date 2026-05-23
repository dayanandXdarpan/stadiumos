import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,   // Re-enabled: hydration safety is handled by `mounted` guards
  reactCompiler: true,
  // Expose backend URLs to the browser
  env: {
    NEXT_PUBLIC_API_URL:  process.env.NEXT_PUBLIC_API_URL  || "http://localhost:8000",
    NEXT_PUBLIC_WS_URL:   process.env.NEXT_PUBLIC_WS_URL   || "ws://localhost:8000/ws",
    NEXT_PUBLIC_API_TOKEN: process.env.NEXT_PUBLIC_API_TOKEN || "stadiumos-demo-token",
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
