import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const artifactPath = path.resolve(
  __dirname,
  "../../../packages/contracts/artifacts/contracts/AndromedaWorks.sol/AndromedaWorks.json",
);
const outputPath = path.resolve(
  __dirname,
  "../src/lib/chain/andromeda-works.abi.json",
);

if (!fs.existsSync(artifactPath)) {
  console.error(
    "AndromedaWorks artifact not found. Run `pnpm contracts:build` first.",
  );
  process.exit(1);
}

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
fs.writeFileSync(outputPath, `${JSON.stringify(artifact.abi, null, 2)}\n`);
console.log(`Synced AndromedaWorks ABI (${artifact.abi.length} entries) to ${outputPath}`);
