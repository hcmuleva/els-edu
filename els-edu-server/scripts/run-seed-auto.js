#!/usr/bin/env node

// Auto seed helper
// - If BEARER_TOKEN is present in env/.env, runs the legacy HTTP seeder with that token
// - Otherwise runs the advanced in-process seeder

const { spawnSync } = require("child_process");
const path = require("path");
const dotenv = require("dotenv");

// Load .env if present
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const BEARER_TOKEN = process.env.BEARER_TOKEN;

function runCommand(cmd, args, envVars) {
  const env = Object.assign({}, process.env, envVars || {});
  const res = spawnSync(cmd, args, { stdio: "inherit", shell: false, env });
  return res.status;
}

console.log("\n🔁 Auto seeder starting...");

if (BEARER_TOKEN) {
  console.log(
    "ℹ️  Found BEARER_TOKEN in environment. Running legacy HTTP seeder with token."
  );
  const status = runCommand("npm", ["run", "seed:legacy"], { BEARER_TOKEN });
  process.exit(status === 0 ? 0 : 1);
} else {
  console.log(
    "ℹ️  No BEARER_TOKEN found. Running advanced in-process seeder (recommended)."
  );
  const status = runCommand("npm", ["run", "seed"]);
  process.exit(status === 0 ? 0 : 1);
}
