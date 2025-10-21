const fs = require('fs');
const path = require('path');

const distIndex = path.resolve(__dirname, '..', 'dist', 'index.html');
const outIndex = path.resolve(__dirname, '..', 'index.html');

try {
  if (!fs.existsSync(distIndex)) {
    console.warn('No dist/index.html found. Run the build first.');
    process.exit(0);
  }
  fs.copyFileSync(distIndex, outIndex);
  console.log('Copied dist/index.html to project root as index.html');
} catch (err) {
  console.error('Failed to copy index.html to root:', err);
  process.exit(1);
}
