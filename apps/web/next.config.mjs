import path from "node:path";
import { fileURLToPath } from "node:url";

const monorepoRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Required for Next.js file tracing in a pnpm monorepo (Vercel deploy).
  outputFileTracingRoot: monorepoRoot,
};

export default nextConfig;
