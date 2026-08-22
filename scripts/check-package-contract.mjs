#!/usr/bin/env node
/**
 * Verify the published package contract against real builds.
 *
 * Run after `npm run build`:
 *   npm run package-contract
 *
 * Checks:
 * 1. CJS entry loads with require() and exports the public API.
 * 2. Every relative specifier in emitted ESM carries an explicit extension.
 * 3. esm/package.json marks the directory as ES modules.
 * 4. The ESM entry loads with native import() and exposes the same API.
 */

import { createRequire } from 'node:module';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const require = createRequire(import.meta.url);

const cjs = require(path.join(root, 'lib', 'index.js'));
if (typeof cjs.fixMarkdown !== 'function') {
  throw new TypeError('CJS entry does not export fixMarkdown');
}
if (typeof cjs.RuleExecutionFailure !== 'function') {
  throw new TypeError('CJS entry does not export RuleExecutionFailure');
}

async function listJsFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? listJsFiles(full) : Promise.resolve(full.endsWith('.js') ? [full] : []);
    }),
  );
  return files.flat();
}

const esmDir = path.join(root, 'esm');
for (const file of await listJsFiles(esmDir)) {
  const source = await readFile(file, 'utf8');
  const specifiers = [...source.matchAll(/(?:\bfrom|\bimport)\s*\(?\s*['"](\.[^'"]+)['"]/g)].map(
    match => match[1],
  );
  // Node ESM resolves relative specifiers literally. Only .js/.cjs/.mjs/.json load.
  const bad = specifiers.filter(spec => !/\.(?:js|cjs|mjs|json)$/.test(spec));
  if (bad.length > 0) {
    throw new Error(`${path.relative(root, file)} has specifiers Node cannot resolve:\n${bad.join('\n')}`);
  }
}

const esmPackageJson = JSON.parse(await readFile(path.join(esmDir, 'package.json'), 'utf8'));
if (esmPackageJson.type !== 'module') {
  throw new Error('esm/package.json must set {"type": "module"}');
}

const esm = await import(pathToFileURL(path.join(esmDir, 'index.js')));
for (const name of ['fixMarkdown', 'lintMarkdown', 'RuleExecutionFailure']) {
  if (typeof esm[name] !== 'function') {
    throw new TypeError(`ESM entry does not export ${name}`);
  }
}

console.log('Package contract OK');
