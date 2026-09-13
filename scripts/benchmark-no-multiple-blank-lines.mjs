#!/usr/bin/env node
/**
 * Measure no-multiple-blank-lines with many protected blocks.
 *
 * Build each target before the test.
 *
 * Usage:
 *   node scripts/benchmark-no-multiple-blank-lines.mjs
 *   node scripts/benchmark-no-multiple-blank-lines.mjs --target /path/to/build
 *   node scripts/benchmark-no-multiple-blank-lines.mjs 1000 5000 10000
 */

import { createRequire } from 'node:module';
import path from 'node:path';

const DEFAULT_SIZES = [1000, 5000, 10000];
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
const core = requireFromTarget(path.join(target, 'lib/index.js'));
const { runLint } = requireFromTarget(path.join(target, 'lib/core/run-lint.js'));
const configs = [{ rule: core.noMultipleBlankLines }];

const createMarkdown = (size) => {
  const blocks = [];

  for (let index = 0; index < size; index++) {
    blocks.push([
      '```text',
      `protected ${index}`,
      '',
      '',
      `next ${index}`,
      '```'
    ].join('\n'));
  }

  return blocks.join('\n');
};

const median = (values) => {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
};

const measure = (markdown) => {
  const run = () => runLint(markdown, configs, { computeFixes: false });

  for (let index = 0; index < 2; index++) run();

  const samples = [];
  let reportCount = 0;
  for (let index = 0; index < 7; index++) {
    const start = performance.now();
    const result = run();
    samples.push(performance.now() - start);
    reportCount = result.reports.length;
  }

  return { reportCount, medianMs: median(samples) };
};

console.log(`Target: ${target}`);
console.log('| Protected blocks | Blank groups | Input bytes | Reports | Median |');
console.log('| ---: | ---: | ---: | ---: | ---: |');

for (const size of sizes) {
  const markdown = createMarkdown(size);
  const result = measure(markdown);

  if (result.reportCount !== 0) {
    throw new Error(`Expected no reports, received ${result.reportCount}.`);
  }

  console.log(
    `| ${size} | ${size} | ${Buffer.byteLength(markdown)} | ${result.reportCount} | ${result.medianMs.toFixed(3)} ms |`
  );
}
