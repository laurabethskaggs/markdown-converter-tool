const { copyFileSync, mkdirSync, existsSync } = require('fs');
const { join } = require('path');

const src = join(process.cwd(), 'node_modules', 'wasm-pandoc', 'pandoc.wasm');
const destDir = join(process.cwd(), 'public');
const dest = join(destDir, 'pandoc.wasm');

try {
  if (!existsSync(src)) {
    console.warn('[pandoc-wasm] pandoc.wasm not found in node_modules. Install dependencies first.');
    process.exit(0);
  }
  mkdirSync(destDir, { recursive: true });
  copyFileSync(src, dest);
  console.log('[pandoc-wasm] Copied pandoc.wasm to public/');
} catch (err) {
  console.error('[pandoc-wasm] Failed to copy pandoc.wasm', err);
  process.exit(1);
}
