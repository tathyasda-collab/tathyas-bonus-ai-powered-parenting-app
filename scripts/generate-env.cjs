// scripts/generate-env.cjs
// Overwrite env files in multiple locations so the build includes correct values.
// This file does NOT print the secret values to the build logs (only presence checks).

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const outRoot = p => path.join(root, p);
const outSrcTs = outRoot('src/env.ts');        // For a TypeScript source file
const outSrcJs = outRoot('src/env.js');        // For a JS source file (if JS is used)
const outRootEnv = outRoot('env.js');          // root env.js (existing)
const outRootProd = outRoot('env.production.js');
const outPublic = outRoot('public/env.js');    // ensure public exists so it's copied by Vite

const vars = {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  API_KEY: process.env.API_KEY || ''
};

// Presence checks (only true/false printed)
console.log('CONFIG CHECK - SUPABASE_URL present?', !!vars.SUPABASE_URL);
console.log('CONFIG CHECK - SUPABASE_ANON_KEY present?', !!vars.SUPABASE_ANON_KEY);
console.log('CONFIG CHECK - API_KEY present?', !!vars.API_KEY);

// 1) Write module-style JS file (export) for env.js / env.production.js
const moduleContent = `// AUTO-GENERATED DURING BUILD - module JS
export const APP_CONFIG = {
  env: ${JSON.stringify(vars, null, 2)}
};
`;

// 2) Write a TypeScript file (src/env.ts) that exports same object (bundler-friendly)
const tsContent = `// AUTO-GENERATED DURING BUILD - TypeScript
export const APP_CONFIG = {
  env: ${JSON.stringify(vars, null, 2) }
} as const;
`;

// 3) Write a public/global script in case the app wants window.APP_CONFIG (served statically)
const publicContent = `// AUTO-GENERATED DURING BUILD - public/global
window.APP_CONFIG = {
  env: ${JSON.stringify(vars, null, 2)}
};
`;

// Ensure public folder exists
try {
  fs.mkdirSync(path.join(root, 'public'), { recursive: true });
} catch (e) {
  // ignore
}

// Write files (silently overwrite)
try {
  fs.writeFileSync(outRootEnv, moduleContent, 'utf8');
  fs.writeFileSync(outRootProd, moduleContent, 'utf8');
  fs.writeFileSync(outPublic, publicContent, 'utf8');
  // Prefer TS source file (if project uses TS). If not present, we'll write JS source fallback as well.
  fs.writeFileSync(outSrcTs, tsContent, 'utf8');
  fs.writeFileSync(outSrcJs, moduleContent, 'utf8');
  console.log('Wrote env files to: root env.js, env.production.js, src/env.ts, src/env.js, public/env.js');
} catch (err) {
  console.error('Failed to write one or more env files:', err);
  process.exit(1);
}

// If any critical var is missing, fail the build so you fix Vercel settings (helps avoid bad deploys)
if (!vars.SUPABASE_URL || !vars.SUPABASE_ANON_KEY || !vars.API_KEY) {
  console.error('ERROR: One or more required build environment variables are missing. Aborting build.');
  process.exit(1);
}
