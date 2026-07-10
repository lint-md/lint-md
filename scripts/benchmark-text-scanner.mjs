#!/usr/bin/env node
/**
 * Micro benchmark for TextScanner positionAt optimization.
 *
 * Compares linear scan (old) vs binary search (new) for positionAt.
 *
 * Usage:
 *   node scripts/benchmark-text-scanner.mjs [--lines 1000] [--matches 500]
 */

const CHINESE = '的一是在不了有和人这中大为上个国以要到和自地们时生就学对得也子说着可';

function generateText(lineCount, avgLineLength) {
  const lines = [];
  for (let i = 0; i < lineCount; i++) {
    const len = avgLineLength + Math.floor(Math.random() * 20);
    let line = '';
    for (let j = 0; j < len; j++) {
      line += CHINESE[j % CHINESE.length];
    }
    lines.push(line);
  }
  return lines.join('\n');
}

function generateMatches(text, count) {
  const matches = [];
  const step = Math.floor(text.length / (count + 1));
  for (let i = 0; i < count; i++) {
    const idx = step * (i + 1);
    const len = Math.min(5, text.length - idx);
    if (len > 0) matches.push({ index: idx, length: len });
  }
  return matches;
}

// Old implementation: linear scan
function positionAtLinear(value, startLine, startColumn, startOffset, index) {
  let line = startLine;
  let column = startColumn;
  for (let i = 0; i < index; i++) {
    if (value[i] === '\n') {
      line++;
      column = 1;
    } else {
      column++;
    }
  }
  return { line, column, offset: startOffset + index };
}

// New implementation: binary search
function buildLineBreakIndices(value) {
  const indices = [];
  for (let i = 0; i < value.length; i++) {
    if (value[i] === '\n') indices.push(i);
  }
  return indices;
}

function positionAtBinary(value, lineBreakIndices, startLine, startColumn, startOffset, index) {
  const lb = lineBreakIndices;
  let lo = 0;
  let hi = lb.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (lb[mid] < index) lo = mid + 1;
    else hi = mid;
  }
  const line = startLine + lo;
  const column = lo === 0
    ? startColumn + index
    : index - lb[lo - 1];
  return { line, column, offset: startOffset + index };
}

function bench(label, fn, iterations) {
  // Warmup
  for (let i = 0; i < Math.min(10, iterations); i++) fn();

  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const elapsed = performance.now() - start;
  const opsPerSec = Math.round((iterations / elapsed) * 1000);
  console.log(`  ${label}: ${Math.round(elapsed)}ms (${opsPerSec} ops/sec)`);
  return elapsed;
}

// --- Main ---
const args = process.argv.slice(2);
const opts = { lines: 1000, matches: 500 };
for (let i = 2; i < args.length; i += 2) {
  if (args[i] === '--lines') opts.lines = parseInt(args[i + 1], 10);
  if (args[i] === '--matches') opts.matches = parseInt(args[i + 1], 10);
}

const text = generateText(opts.lines, 60);
const matches = generateMatches(text, opts.matches);
const lineBreakIndices = buildLineBreakIndices(text);

console.log(`Text: ${text.length} chars, ${lineBreakIndices.length} lines, ${matches.length} matches\n`);

const iterations = 1000;

console.log('positionAt (single call):');
const idx = Math.floor(text.length / 2);
bench('linear', () => {
  positionAtLinear(text, 1, 1, 0, idx);
}, iterations);
bench('binary', () => {
  positionAtBinary(text, lineBreakIndices, 1, 1, 0, idx);
}, iterations);

console.log(`\nfindAllMatches (${matches.length} matches, each calling positionAt):`);
bench('linear', () => {
  for (const m of matches) {
    positionAtLinear(text, 1, 1, 0, m.index);
    positionAtLinear(text, 1, 1, 0, m.index + m.length);
  }
}, Math.round(iterations / 10));
bench('binary', () => {
  for (const m of matches) {
    positionAtBinary(text, lineBreakIndices, 1, 1, 0, m.index);
    positionAtBinary(text, lineBreakIndices, 1, 1, 0, m.index + m.length);
  }
}, Math.round(iterations / 10));
