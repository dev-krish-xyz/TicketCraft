#!/usr/bin/env node
/**
 * Push .env.local keys to Vercel Production (and Preview).
 * Requires: npx vercel login && npx vercel link
 *
 * Usage: node scripts/push-vercel-env.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");

if (!existsSync(envPath)) {
  console.error("Missing .env.local");
  process.exit(1);
}

const REQUIRED = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "AUTH_GITHUB_ID",
  "AUTH_GITHUB_SECRET",
];

const OPTIONAL = [
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "GROQ_API_KEY",
  "UPLOADTHING_TOKEN",
  "SENTRY_WEBHOOK_SECRET",
];

function parseEnv(text) {
  const out = {};
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const env = parseEnv(readFileSync(envPath, "utf8"));

// Production must use the Vercel URL, not localhost
const prodAuthUrl = "https://ticket-craft.vercel.app";

function vercelEnvAdd(key, value, environment) {
  // Remove existing then add (vercel env add fails if exists)
  spawnSync("npx", ["vercel", "env", "rm", key, environment, "-y"], {
    cwd: root,
    stdio: "pipe",
    encoding: "utf8",
  });

  const result = spawnSync(
    "npx",
    ["vercel", "env", "add", key, environment],
    {
      cwd: root,
      input: value + "\n",
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }
  );

  if (result.status !== 0) {
    console.error(`Failed to set ${key} (${environment}):`, result.stderr || result.stdout);
    return false;
  }
  console.log(`✓ ${key} → ${environment}`);
  return true;
}

const keys = [...REQUIRED, ...OPTIONAL].filter((k) => env[k]);
for (const k of REQUIRED) {
  if (!env[k]) {
    console.error(`Missing required key in .env.local: ${k}`);
    process.exit(1);
  }
}

console.log("Pushing env vars to Vercel (Production + Preview)...\n");

let ok = true;
for (const key of keys) {
  const value = key === "AUTH_URL" ? prodAuthUrl : env[key];
  // always set AUTH_URL for production below
  if (key === "AUTH_URL") continue;
  ok = vercelEnvAdd(key, value, "production") && ok;
  ok = vercelEnvAdd(key, value, "preview") && ok;
}

// AUTH_URL: production = vercel domain; preview can use VERCEL_URL via trustHost
ok = vercelEnvAdd("AUTH_URL", prodAuthUrl, "production") && ok;
// local-style for preview is fine; trustHost handles it
if (env.AUTH_URL) {
  ok = vercelEnvAdd("AUTH_URL", env.AUTH_URL, "preview") && ok;
}

if (!ok) {
  console.error("\nSome vars failed. Run: npx vercel login && npx vercel link");
  process.exit(1);
}

console.log("\nDone. Redeploy with: npx vercel --prod");
console.log("Or: Vercel Dashboard → Deployments → Redeploy");
