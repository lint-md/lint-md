#!/usr/bin/env node
/**
 * Micro benchmark for TextScanner positionAt optimization.
 *
 * Compares linear scan (old) vs binary search with lazy pre-computation (new).
 * Includes constructor cost in timing to reflect real-world usage.
 *
 * Usage:
 *   node scripts/benchmark-text-scanner.mjs [--lines 1000] [--matches 500] [--runs 5]
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

// --- Old implementation: linear scan (no pre-computation) ---
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

function matchAtLinear(value, startLine, startColumn, startOffset, index, length) {
  const start = positionAtLinear(value, startLine, startColumn, startOffset, index);
  let endLine = start.line;
  let endColumn = start.column;
  for (let i = 0; i < length; i++) {
    if (value[index + i] === '\n') {
      endLine++;
      endColumn = 1;
    } else {
      endColumn++;
    }
  }
  return {
    index, length,
    loc: { start: { line: start.line, column: start.column, offset: start.offset }, end: { line: endLine, column: endColumn, offset: start.offset + length } },
    absoluteRange: [start.offset, start.offset + length]
  };
}

// --- New implementation: lazy binary search ---
function buildLineBreakIndices(value) {
  const indices = [];
  for (let i = 0; i < value.length; i++) {
    if (value[i] === '\n') indices.push(i);
  }
  return indices;
}

function positionAtBinary(lineBreakIndices, startLine, startColumn, startOffset, index) {
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

function matchAtBinary(lineBreakIndices, startLine, startColumn, startOffset, index, length) {
  const start = positionAtBinary(lineBreakIndices, startLine, startColumn, startOffset, index);
  const end = positionAtBinary(lineBreakIndices, startLine, startColumn, startOffset, index + length);
  return {
    index, length,
    loc: { start: { line: start.line, column: start.column, offset: start.offset }, end: { line: end.line, column: end.column, offset: start.offset + length } },
    absoluteRange: [start.offset, start.offset + length]
  };
}

function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function bench(label, fn, iterations, runs) {
  const times = [];
  for (let r = 0; r < runs; r++) {
    // Warmup
    for (let i = 0; i < Math.min(10, iterations); i++) fn();
    const start = performance.now();
    for (let i = 0; i < iterations; i++) fn();
    times.push(performance.now() - start);
  }
  const med = median(times);
  const opsPerSec = Math.round((iterations / med) * 1000);
  console.log(`  ${label}: ${med.toFixed(3)}ms median (${opsPerSec} ops/sec)`);
  return med;
}

// --- Main ---
const args = process.argv.slice(2);
const opts = { lines: 1000, matches: 500, runs: 5 };
for (let i = 0; i < args.length; i += 2) {
  if (args[i] === '--lines') opts.lines = parseInt(args[i + 1], 10);
  if (args[i] === '--matches') opts.matches = parseInt(args[i + 1], 10);
  if (args[i] === '--runs') opts.runs = parseInt(args[i + 1], 10);
}

const text = generateText(opts.lines, 60);
const matches = generateMatches(text, opts.matches);

console.log(`Text: ${text.length} chars, ${opts.lines} lines, ${matches.length} matches, ${opts.runs} runs\n`);

const iterations = 1000;

// Scenario 1: positionAt only (single call at text midpoint)
console.log('=== positionAt only (single call) ===');
const idx = Math.floor(text.length / 2);
bench('linear (no pre-compute)', () => {
  positionAtLinear(text, 1, 1, 0, idx);
}, iterations, opts.runs);
bench('binary (lazy pre-compute)', () => {
  const lb = buildLineBreakIndices(text);
  positionAtBinary(lb, 1, 1, 0, idx);
}, iterations, opts.runs);

// Scenario 2: matchAt only (single call)
console.log('\n=== matchAt only (single call) ===');
bench('linear', () => {
  matchAtLinear(text, 1, 1, 0, idx, 5);
}, iterations, opts.runs);
bench('binary', () => {
  const lb = buildLineBreakIndices(text);
  matchAtBinary(lb, 1, 1, 0, idx, 5);
}, iterations, opts.runs);

// Scenario 3: findAllMatches simulation — constructor + all matchAt calls
// This is the fair comparison: total cost of TextScanner lifecycle
console.log(`\n=== findAllMatches simulation (${matches.length} matches, constructor included) ===`);
bench('linear (no pre-compute)', () => {
  // Old: constructor O(1) + N matchAt calls O(index) each
  for (const m of matches) {
    matchAtLinear(text, 1, 1, 0, m.index, m.length);
  }
}, Math.round(iterations / 10), opts.runs);
bench('binary (lazy pre-compute)', () => {
  // New: first matchAt triggers O(n) constructor, then O(log k) per call
  let lb = null;
  for (const m of matches) {
    if (!lb) lb = buildLineBreakIndices(text);
    matchAtBinary(lb, 1, 1, 0, m.index, m.length);
  }
}, Math.round(iterations / 10), opts.runs);

// Scenario 4: forEachChar-only rules — should show no regression
console.log('\n=== forEachChar simulation (no positionAt calls) ===');
bench('linear (old constructor)', () => {
  // Old: O(1) constructor, then O(n) forEachChar
  let line = 1, column = 1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') { line++; column = 1; } else { column++; }
  }
}, iterations, opts.runs);
bench('binary (new lazy constructor)', () => {
  // New: O(1) constructor (lazy), then O(n) forEachChar
  // Simulate: no positionAt called, so buildLineBreakIndices is never called
  let line = 1, column = 1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') { line++; column = 1; } else { column++; }
  }
}, iterations, opts.runs);
