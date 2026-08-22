#!/usr/bin/env node
/**
 * Write esm/package.json after the ESM emit.
 *
 * The root package.json has no "type" field. Without this marker file, Node
 * parses every emitted .js file under esm/ as CommonJS and fails on
 * import/export syntax.
 */

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, 'esm', 'package.json');

await writeFile(target, `${JSON.stringify({ type: 'module' }, null, 2)}\n`);
console.log(`wrote ${path.relative(root, target)}`);
