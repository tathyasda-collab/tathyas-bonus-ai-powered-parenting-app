// scripts/generate-env.cjs
// Generates a .env.production file for Vite using your real Vercel environment variables.

const fs = require("fs");
const path = require("path");

const vars = {
  VITE_SUPABASE_URL: process.env.SUPABASE_URL || "",
  VITE_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",
  VITE_API_KEY: process.env.API_KEY || "",
};

// Log presence (true/false) for debugging
console.log("CONFIG CHECK - SUPABASE_URL present?", !!vars.VITE_SUPABASE_URL);
console.log("CONFIG CHECK - SUPABASE_ANON_KEY present?", !!vars.VITE_SUPABASE_ANON_KEY);
console.log("CONFIG CHECK - API_KEY present?", !!vars.VITE_API_KEY);

// Generate a `.env.production` file (used by Vite automatically)
const envLines = Object.entries(vars)
  .map(([key, value]) => `${key}=${value}`)
  .join("\n");

const outPath = path.join(__dirname, "..", ".env.production");

fs.writeFileSync(outPath, envLines, "utf8");
console.log("✅ Wrote", outPath);

// Fail build if any important variable is missing
if (!vars.VITE_SUPABASE_URL || !vars.VITE_SUPABASE_ANON_KEY || !vars.VITE_API_KEY) {
  console.error("❌ Missing one or more required environment variables.");
  process.exit(1);
}
