const CONNECT_SRC = [
  "'self'",
  "https://*.g.alchemy.com",
  "https://*.alchemy.com",
  "https://*.walletconnect.com",
  "https://*.walletconnect.org",
  "wss://*.walletconnect.com",
  "wss://*.walletconnect.org",
  "https://rpc.walletconnect.org",
  "https://verify.walletconnect.com",
  "https://pulse.walletconnect.com",
  "https://api.web3modal.org",
  "https://secure.walletconnect.com",
  "https://ipfs.io",
  "https://gateway.pinata.cloud",
  "https://api.pinata.cloud",
  "https://*.mypinata.cloud",
  "https://arweave.net",
  "https://*.arweave.net",
  "https://*.ar.io",
];

const IMG_SRC = [
  "'self'",
  "data:",
  "blob:",
  "https://ipfs.io",
  "https://gateway.pinata.cloud",
  "https://*.mypinata.cloud",
  "https://arweave.net",
  "https://*.arweave.net",
  "https://*.ar.io",
];

const FONT_SRC = ["'self'", "data:", "https://fonts.gstatic.com"];

/** @param {readonly string[]} values */
function joinDirective(values) {
  return values.join(" ");
}

/** Builds the CSP header value for production responses. */
export function buildContentSecurityPolicy() {
  return [
    "default-src 'self'",
    `connect-src ${joinDirective(CONNECT_SRC)}`,
    `img-src ${joinDirective(IMG_SRC)}`,
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    `font-src ${joinDirective(FONT_SRC)}`,
    "frame-ancestors 'none'",
  ].join("; ");
}

export function getConnectSrcAllowlist() {
  return CONNECT_SRC;
}
