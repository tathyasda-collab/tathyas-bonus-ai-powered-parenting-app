// scripts/generate-env.cjs
// Generate .env.production for Vite (VITE_ prefixed keys).
// This script writes only .env.production (no env.js) so import.meta.env gets populated.

const fs = require('fs');
const path = require('path');

const outPath = path.join(__dirname, '..', '.env.production');

// Support both prefixed (VITE_*) and unprefixed env vars. Some hosts (Vercel)
// may expose VITE_* variables while others expose unprefixed names. Prefer the
// VITE_* version if present, otherwise fall back to the unprefixed name.
const vars = {
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "",
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "",
  VITE_API_KEY: process.env.VITE_API_KEY || process.env.API_KEY || "",
};

// Log presence only (no secret values)
console.log("CONFIG CHECK - VITE_SUPABASE_URL present?", !!vars.VITE_SUPABASE_URL);
console.log("CONFIG CHECK - VITE_SUPABASE_ANON_KEY present?", !!vars.VITE_SUPABASE_ANON_KEY);
console.log("CONFIG CHECK - VITE_API_KEY present?", !!vars.VITE_API_KEY);

// Write .env.production so Vite picks up VITE_* variables at build time
const content = Object.entries(vars).map(([k, v]) => `${k}=${v}`).join("\n");
fs.writeFileSync(outPath, content, "utf8");
console.log("✅ Wrote", outPath);

// Fail fast if a required var is missing
if (!vars.VITE_SUPABASE_URL || !vars.VITE_SUPABASE_ANON_KEY || !vars.VITE_API_KEY) {
  console.error("❌ Missing one or more required environment variables at build time.");
  process.exit(1);
}
