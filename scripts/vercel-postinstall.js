/**
 * Installs web app dependencies when Vercel runs `npm i` at the repository
 * root. Skipped during local `pnpm install` to avoid mixing package managers.
 */
const { execSync } = require("node:child_process");

if (process.env.VERCEL === "1") {
  execSync("npm install --prefix apps/web --legacy-peer-deps", {
    stdio: "inherit",
  });
}
