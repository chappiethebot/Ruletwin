import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Snapshots and exports are read from disk at request time; make sure serverless
  // deployments (e.g. Vercel) bundle them with every route.
  outputFileTracingIncludes: {
    "/**": ["./data/snapshots/**/*", "./submission/**/*"],
  },
};

export default nextConfig;
