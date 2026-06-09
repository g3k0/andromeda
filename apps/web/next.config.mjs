/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Content-Security-Policy-Report-Only",
    value: "default-src 'self'; frame-ancestors 'none';",
  },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
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
    };
    return config;
  },
};

export default nextConfig;
