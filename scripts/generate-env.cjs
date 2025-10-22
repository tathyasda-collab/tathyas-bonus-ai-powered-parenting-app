// scripts/generate-env.cjs  (replace entire file contents with this)
const fs = require('fs');
const path = require('path');

const outPath = path.join(__dirname, '..', 'env.js');
const outProdPath = path.join(__dirname, '..', 'env.production.js');

const vars = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  API_KEY: process.env.API_KEY
};

// Log presence (true/false) so we can see in build logs whether Vercel provided them.
// IMPORTANT: do NOT print the actual secret values.
console.log('CONFIG CHECK - SUPABASE_URL present?', !!vars.SUPABASE_URL);
console.log('CONFIG CHECK - SUPABASE_ANON_KEY present?', !!vars.SUPABASE_ANON_KEY);
console.log('CONFIG CHECK - API_KEY present?', !!vars.API_KEY);

// Create the file but with values as strings (we still write the real values so the app can use them).
// This will write the real values into env.js (be cautious; Vercel logs won't show them).
const content = `// AUTO-GENERATED DURING BUILD
export const APP_CONFIG = {
  env: ${JSON.stringify({
    SUPABASE_URL: vars.SUPABASE_URL || '',
    SUPABASE_ANON_KEY: vars.SUPABASE_ANON_KEY || '',
    API_KEY: vars.API_KEY || ''
  }, null, 2)}
};
`;

fs.writeFileSync(outPath, content, 'utf8');
fs.writeFileSync(outProdPath, content, 'utf8');

console.log('Wrote', outPath);
console.log('Wrote', outProdPath);

// If any critical var is missing, exit with non-zero code so the build fails and we fix Vercel settings.
if (!vars.SUPABASE_URL || !vars.SUPABASE_ANON_KEY || !vars.API_KEY) {
  console.error('ERROR: One or more required build environment variables are missing. Aborting build.');
  process.exit(1);
}
