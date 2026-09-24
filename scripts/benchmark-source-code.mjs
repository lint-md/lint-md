#!/usr/bin/env node
/**
 * Measure SourceCode creation and the first position lookup.
 *
 * Build each target before the test.
 *
 * Usage:
 *   node scripts/benchmark-source-code.mjs
 *   node scripts/benchmark-source-code.mjs --target /path/to/build
 *   node scripts/benchmark-source-code.mjs 65536 262144 1048576
 */

import { createRequire } from 'node:module';
import path from 'node:path';

const DEFAULT_SIZES = [64 * 1024, 256 * 1024, 1024 * 1024];
const args = process.argv.slice(2);
let target = process.cwd();
const sizeArgs = [];

for (let index = 0; index < args.length; index++) {
  if (args[index] === '--target') {
    target = path.resolve(args[++index]);
  }
  else {
    sizeArgs.push(args[index]);
  }
}

const parsedSizes = sizeArgs.map(value => Number.parseInt(value, 10));
const sizes = parsedSizes.length > 0 ? parsedSizes : DEFAULT_SIZES;

if (sizes.some(size => !Number.isSafeInteger(size) || size < 1)) {
  throw new Error('Sizes must be positive integers.');
}

const requireFromTarget = createRequire(path.join(target, 'package.json'));
const { createLintSourceCode } = requireFromTarget(
  path.join(target, 'lib/utils/source-code.js')
);

const createText = size => 'line\n\n'.repeat(Math.ceil(size / 6)).slice(0, size);

const median = (values) => {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
};

const measure = (run, iterations) => {
  let checksum = 0;

  for (let index = 0; index < iterations; index++) {
    checksum += run();
  }

  const samples = [];
  for (let sample = 0; sample < 7; sample++) {
    const start = performance.now();
    for (let index = 0; index < iterations; index++) {
      checksum += run();
    }
    samples.push((performance.now() - start) / iterations);
  }

  if (checksum === 0) {
    throw new Error('Benchmark checksum must be positive.');
  }

  return median(samples);
};

console.log(`Target: ${target}`);
console.log('| Input bytes | Lines | Iterations | Create | Create + first position |');
console.log('| ---: | ---: | ---: | ---: | ---: |');

for (const size of sizes) {
  const text = createText(size);
  const ast = { type: 'root', children: [] };
  const sourceMap = {};
  const iterations = Math.max(10, Math.floor((16 * 1024 * 1024) / size));
  const create = () => createLintSourceCode({ text, ast, sourceMap });
  const createOnlyMs = measure(() => create().text.length, iterations);
  const createAndLocateMs = measure(() => {
    const sourceCode = create();
    return sourceCode.getPosition(text.length).line;
  }, iterations);
  const lineCount = text.split('\n').length;

  console.log(
    `| ${size} | ${lineCount} | ${iterations} | ${createOnlyMs.toFixed(6)} ms | ${createAndLocateMs.toFixed(3)} ms |`
  );
}
