#!/usr/bin/env node
/**
 * Measure space-around-link with many siblings in one paragraph.
 *
 * Build the target before the test.
 *
 * Usage:
 *   node scripts/benchmark-space-around-link.mjs
 *   node scripts/benchmark-space-around-link.mjs --target /path/to/build
 *   node scripts/benchmark-space-around-link.mjs 1000 5000 10000
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
const spaceAroundLink = requireFromTarget(
  path.join(target, 'lib/rules/space-around-link.js')
).default;

const point = offset => ({ line: 1, column: offset + 1, offset });
const position = (start, end) => ({ start: point(start), end: point(end) });

const createFixture = (linkCount) => {
  const children = [];
  const links = [];
  const sourceParts = [','];
  let offset = 0;

  children.push({ type: 'text', value: ',', position: position(0, 1) });
  offset++;

  for (let index = 0; index < linkCount; index++) {
    const start = offset;
    const end = start + 6;
    const link = {
      type: 'link',
      url: 'u',
      title: null,
      children: [{
        type: 'text',
        value: 'x',
        position: position(start + 1, start + 2)
      }],
      position: position(start, end)
    };

    children.push(link);
    links.push(link);
    children.push({
      type: 'text',
      value: ',',
      position: position(end, end + 1)
    });
    sourceParts.push('[x](u),');
    offset = end + 1;
  }

  const ast = {
    type: 'root',
    children: [{
      type: 'paragraph',
      children,
      position: position(0, offset)
    }],
    position: position(0, offset)
  };

  return { ast, links, text: sourceParts.join('') };
};

const median = (values) => {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
};

const measure = (fixture) => {
  const run = () => {
    let reportCount = 0;
    const selectors = spaceAroundLink.create({
      ast: fixture.ast,
      markdown: fixture.text,
      options: {},
      report: () => reportCount++,
      sourceCode: {
        ast: fixture.ast,
        text: fixture.text
      }
    });

    for (const link of fixture.links) {
      selectors.link(link);
    }

    return reportCount;
  };

  run();

  const samples = [];
  let reportCount = 0;
  for (let index = 0; index < 7; index++) {
    const start = performance.now();
    reportCount = run();
    samples.push(performance.now() - start);
  }

  return { reportCount, medianMs: median(samples) };
};

console.log(`Target: ${target}`);
console.log('| Links | Siblings | Median |');
console.log('| ---: | ---: | ---: |');

for (const size of sizes) {
  const fixture = createFixture(size);
  const result = measure(fixture);

  if (result.reportCount !== 0) {
    throw new Error(`Expected no reports, received ${result.reportCount}.`);
  }

  console.log(
    `| ${size} | ${size * 2 + 1} | ${result.medianMs.toFixed(3)} ms |`
  );
}
