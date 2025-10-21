const fs = require('fs');
const path = require('path');

// Usage: node generate-env.cjs [outputDir]
const outDirArg = process.argv[2] || path.join(__dirname, '..');
const outDir = path.isAbsolute(outDirArg) ? outDirArg : path.resolve(process.cwd(), outDirArg);
const outPath = path.join(outDir, 'env.production.js');

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

// Ensure the output directory exists
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, content, { encoding: 'utf8' });
console.log('Wrote', outPath);
if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY || !env.API_KEY) {
  console.warn('Warning: One or more environment variables are empty. Production build may fail or be unusable.');
}
