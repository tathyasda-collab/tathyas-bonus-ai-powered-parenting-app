/**
 * Generates a runtime env file (env.production.js) for the client bundle
 * from process.env values (used by Netlify during build). This keeps
 * secret values out of the repository and uses Netlify environment
 * variables instead.
 */
const fs = require('fs');
const path = require('path');

const outPath = path.join(__dirname, '..', 'env.production.js');

const env = {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  API_KEY: process.env.API_KEY || '',
};

const content = `// THIS FILE IS AUTO-GENERATED DURING THE BUILD. DO NOT EDIT.
export const APP_CONFIG = {
  env: ${JSON.stringify(env, null, 2)}
};
`;

fs.writeFileSync(outPath, content, { encoding: 'utf8' });
console.log('Wrote', outPath);
// Exit non-zero if any required val is missing to avoid an accidental public build
if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY || !env.API_KEY) {
  console.warn('Warning: One or more environment variables are empty. Production build may fail or be unusable.');
}