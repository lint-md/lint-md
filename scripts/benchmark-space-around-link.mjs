#!/usr/bin/env node
/**
 * Measure space-around-link with many siblings or long adjacent text.
 *
 * Build the target before the test.
 *
 * Usage:
 *   node scripts/benchmark-space-around-link.mjs
 *   node scripts/benchmark-space-around-link.mjs --target /path/to/build
 *   node scripts/benchmark-space-around-link.mjs 1000 5000 10000
 *   node scripts/benchmark-space-around-link.mjs --scenario adjacent-text
 */

import { createRequire } from 'node:module';
import path from 'node:path';

const DEFAULT_SIZES = [1000, 5000, 10000];
const ADJACENT_TEXT_SIZES = [4096, 262144, 1048576];
const args = process.argv.slice(2);
let target = process.cwd();
let scenario = 'siblings';
const sizeArgs = [];

for (let index = 0; index < args.length; index++) {
  if (args[index] === '--target') {
    target = path.resolve(args[++index]);
  }
  else if (args[index] === '--scenario') {
    scenario = args[++index];
  }
  else {
    sizeArgs.push(args[index]);
  }
}

const parsedSizes = sizeArgs.map(value => Number.parseInt(value, 10));
const sizes = parsedSizes.length > 0
  ? parsedSizes
  : scenario === 'adjacent-text' ? ADJACENT_TEXT_SIZES : DEFAULT_SIZES;

if (scenario !== 'siblings' && scenario !== 'adjacent-text') {
  throw new Error('Scenario must be siblings or adjacent-text.');
}

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

const createAdjacentTextFixture = (bytes, edge) => {
  const edgeCharacter = edge === 'emoji'
    ? '😀'
    : edge === 'astral-punctuation' ? '𐄀' : 'a';
  const fill = 'a'.repeat(bytes - Buffer.byteLength(edgeCharacter));
  const left = fill + edgeCharacter;
  const right = edgeCharacter + fill;
  const linkStart = left.length;
  const linkEnd = linkStart + 6;
  const end = linkEnd + right.length;
  const link = {
    type: 'link',
    url: 'u',
    title: null,
    children: [{
      type: 'text',
      value: 'x',
      position: position(linkStart + 1, linkStart + 2)
    }],
    position: position(linkStart, linkEnd)
  };
  const ast = {
    type: 'root',
    children: [{
      type: 'paragraph',
      children: [
        { type: 'text', value: left, position: position(0, linkStart) },
        link,
        { type: 'text', value: right, position: position(linkEnd, end) }
      ],
      position: position(0, end)
    }],
    position: position(0, end)
  };

  return {
    ast,
    links: [link],
    text: `${left}[x](u)${right}`,
    expectedReports: edge === 'astral-punctuation' ? 0 : 2
  };
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

  for (let index = 0; index < 3; index++) {
    run();
  }

  const calibrationStart = performance.now();
  for (let index = 0; index < 3; index++) {
    run();
  }
  const estimatedMs = Math.max((performance.now() - calibrationStart) / 3, 0.001);
  const iterations = Math.min(10000, Math.max(1, Math.ceil(30 / estimatedMs)));

  const samples = [];
  let reportCount = 0;
  for (let index = 0; index < 7; index++) {
    const start = performance.now();
    for (let runIndex = 0; runIndex < iterations; runIndex++) {
      reportCount = run();
    }
    samples.push((performance.now() - start) / iterations);
  }

  return { reportCount, medianMs: median(samples), iterations };
};

console.log(`Target: ${target}`);

if (scenario === 'adjacent-text') {
  console.log('| Adjacent text | Boundary | Runs per sample | Median per run |');
  console.log('| ---: | --- | ---: | ---: |');

  for (const size of sizes) {
    for (const edge of ['ascii', 'emoji', 'astral-punctuation']) {
      const fixture = createAdjacentTextFixture(size, edge);
      const result = measure(fixture);

      if (result.reportCount !== fixture.expectedReports) {
        throw new Error(`Expected ${fixture.expectedReports} reports, received ${result.reportCount}.`);
      }

      console.log(`| ${size} B | ${edge} | ${result.iterations} | ${result.medianMs.toFixed(3)} ms |`);
    }
  }
}
else {
  console.log('| Links | Siblings | Runs per sample | Median per run |');
  console.log('| ---: | ---: | ---: | ---: |');

  for (const size of sizes) {
    const fixture = createFixture(size);
    const result = measure(fixture);

    if (result.reportCount !== 0) {
      throw new Error(`Expected no reports, received ${result.reportCount}.`);
    }

    console.log(
      `| ${size} | ${size * 2 + 1} | ${result.iterations} | ${result.medianMs.toFixed(3)} ms |`
    );
  }
}
