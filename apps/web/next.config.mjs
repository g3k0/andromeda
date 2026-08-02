/** @type {import('next').NextConfig} */
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildContentSecurityPolicy } from "./content-security-policy.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveWalletConnectConnectorModule() {
  const candidates = [
    path.join(__dirname, "node_modules/@wagmi/connectors/dist/esm/walletConnect.js"),
    path.join(
      __dirname,
      "../../node_modules/@wagmi/connectors/dist/esm/walletConnect.js",
    ),
  ];

  const resolved = candidates.find((candidate) => existsSync(candidate));
  if (!resolved) {
    throw new Error(
      "Could not resolve @wagmi/connectors walletConnect module for webpack alias",
    );
  }

  return resolved;
}

const walletConnectConnectorModule = resolveWalletConnectConnectorModule();

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Content-Security-Policy",
    value: buildContentSecurityPolicy(),
  },
];

const nextConfig = {
  reactStrictMode: true,
  // Arweave Turbo uploads use @dha-team/arbundles + fetch (not @ardrive/turbo-sdk),
  // so we avoid pulling Solana/rpc-websockets into the serverless runtime.
  serverExternalPackages: ["@dha-team/arbundles", "arweave"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ipfs.io",
        pathname: "/ipfs/**",
      },
    ],
  },
  async headers() {
    if (process.env.NODE_ENV !== "production") {
      return [];
    }

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": false,
      "pino-pretty": false,
      // Optional wagmi connector SDKs — not used; avoid webpack resolving x402/CDP.
      "@base-org/account": false,
      "@coinbase/cdp-sdk": false,
      "@x402/evm": false,
      "@x402/svm/exact/client": false,
      // Direct walletConnect module — bypasses @wagmi/connectors barrel (baseAccount → x402).
      "wagmi-connectors-wallet-connect": walletConnectConnectorModule,
    };
    return config;
  },
};

export default nextConfig;
