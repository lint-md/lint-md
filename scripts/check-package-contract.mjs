#!/usr/bin/env node
/**
 * Verify public exports in generated package entries.
 *
 * Run after `npm run build`:
 *   npm run package-contract
 *
 * CJS can be loaded directly. The emitted ESM currently contains extensionless
 * internal imports, so Node cannot load it natively; assert its explicit
 * re-export instead.
 */

import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const require = createRequire(import.meta.url);

const cjs = require(path.join(root, 'lib', 'index.js'));
if (typeof cjs.RuleExecutionFailure !== 'function') {
  throw new Error('CJS entry does not export RuleExecutionFailure');
}

const esmEntry = await readFile(path.join(root, 'esm', 'index.js'), 'utf8');
if (!/export\s*\{\s*RuleExecutionFailure\s*\}/.test(esmEntry)) {
  throw new Error('ESM entry does not explicitly export RuleExecutionFailure');
}

console.log('Package contract OK');
