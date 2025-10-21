const fs = require('fs');
const path = require('path');

// Usage: node generate-env.cjs [outputDir]
const outDirArg = process.argv[2] || path.join(__dirname, '..');
const outDir = path.isAbsolute(outDirArg) ? outDirArg : path.resolve(process.cwd(), outDirArg);
const outPathProd = path.join(outDir, 'env.production.js');
const outPathDev = path.join(outDir, 'env.js');

const env = {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  API_KEY: process.env.API_KEY || '',
};

// Helper to clean values that may include accidental quotes, trailing commas, or stray characters
const clean = (v) => {
  if (typeof v !== 'string') return v;
  let s = v.trim();

  // If value starts and ends with the same quote char, strip them
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
    s = s.slice(1, -1).trim();
  }

  // Remove a trailing comma if present
  if (s.endsWith(',')) s = s.slice(0, -1).trim();

  // Remove obvious stray trailing characters that aren't typically part of URLs/keys
  s = s.replace(/[\s\u0000-\u001F]+$/g, '');
  s = s.replace(/[\x00-\x1F]+$/g, '');

  // If the string contains an accidental unmatched trailing single quote, drop it
  if (s.endsWith("'" ) || s.endsWith('"')) {
    s = s.slice(0, -1).trim();
  }

  return s;
};

// sanitize env values
env.SUPABASE_URL = clean(env.SUPABASE_URL);
env.SUPABASE_ANON_KEY = clean(env.SUPABASE_ANON_KEY);
env.API_KEY = clean(env.API_KEY);

// Basic normalization: ensure SUPABASE_URL looks like a URL. If it lacks a scheme, try to add https://
try {
  if (env.SUPABASE_URL) {
    let url = env.SUPABASE_URL;
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    // validate by constructing a URL object
    const _u = new URL(url);
    // store normalized URL without trailing slash
    env.SUPABASE_URL = _u.origin + _u.pathname.replace(/\/$/, '');
  }
} catch (e) {
  console.warn('generate-env: SUPABASE_URL looks invalid after sanitization; leaving as-is (may be empty)');
  env.SUPABASE_URL = '';
}

const content = `// THIS FILE IS AUTO-GENERATED DURING THE BUILD. DO NOT EDIT.
export const APP_CONFIG = {
  env: ${JSON.stringify(env, null, 2)}
};
`;

// Ensure the output directory exists
fs.mkdirSync(outDir, { recursive: true });

// Write both env.production.js (used for production artifacts) and env.js
fs.writeFileSync(outPathProd, content, { encoding: 'utf8' });
fs.writeFileSync(outPathDev, content, { encoding: 'utf8' });

console.log('Wrote', outPathProd);
console.log('Wrote', outPathDev);

if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY || !env.API_KEY) {
  console.warn('Warning: One or more environment variables are empty. Production build may fail or be unusable.');
}
