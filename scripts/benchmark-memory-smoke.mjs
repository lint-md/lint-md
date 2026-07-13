#!/usr/bin/env node
/**
 * Smoke test for benchmark-memory.mjs.
 *
 * Runs with small inputs and verifies output format.
 * Does NOT assert absolute memory values.
 *
 * Usage:
 *   npm run build
 *   node scripts/benchmark-memory-smoke.mjs
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as path from 'node:path';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const BENCHMARK_PATH = path.join(SCRIPT_DIR, 'benchmark-memory.mjs');

const REQUIRED_FIELDS = [
  'case', 'shape', 'bytes', 'run',
  'wallTimeMs', 'maxRss', 'rssBefore', 'rssAfter', 'rssDelta',
  'heapBefore', 'heapAfter',
  'reportCount', 'fixCount', 'runLintCalls',
  'textScannerIndexBuilds', 'textScannerIndexBuildWallTimeMs',
  'nodeVersion', 'platform', 'arch',
];

const VALID_CASES = new Set([
  'noop', 'input-only', 'parser-only', 'parse-traverse',
  'single-rule', 'text-scanner-rules', 'all-rules', 'fix-mode',
]);

const VALID_SHAPES = new Set([
  'long-paragraph', 'many-paragraphs', 'mixed-markdown',
  'high-match-density', 'low-match-density', 'overlapping-fixes',
]);

function runBenchmark(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [BENCHMARK_PATH, ...args], {
      cwd: path.resolve(SCRIPT_DIR, '..'),
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });

    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });

    child.on('error', reject);
  });
}

function parseNDJSON(text) {
  return text.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
}

function assert(condition, message) {
  if (!condition)
    throw new Error(`Assertion failed: ${message}`);
}

async function main() {
  console.log('Smoke test: benchmark-memory.mjs');

  // Test 1: --help
  let result = await runBenchmark(['--help']);
  assert(result.code === 0, '--help should exit 0');
  assert(result.stdout.includes('Usage'), '--help should print usage');

  // Test 2: basic run with small input
  console.log('  Running benchmark with 4 KiB long-paragraph, 1 run...');
  result = await runBenchmark(['--bytes', '4096', '--shape', 'long-paragraph', '--runs', '1', '--warmup', '0']);
  assert(result.code === 0, 'benchmark should exit 0');
  assert(result.stderr === '', 'benchmark should have no stderr output');

  const lines = parseNDJSON(result.stdout);
  assert(lines.length > 0, 'should output at least one line');

  console.log(`  Got ${lines.length} output lines`);

  // Test 3: validate output format
  for (const line of lines) {
    // Check all required fields exist
    for (const field of REQUIRED_FIELDS) {
      assert(line[field] !== undefined, `field '${field}' should be present`);
    }

    // Check types
    assert(typeof line.bytes === 'number' && line.bytes > 0, 'bytes should be a positive number');
    assert(typeof line.wallTimeMs === 'number' && line.wallTimeMs >= 0, 'wallTimeMs should be a non-negative number');
    assert(typeof line.maxRss === 'number' && line.maxRss > 0, 'maxRss should be positive');
    assert(typeof line.rssBefore === 'number' && line.rssBefore > 0, 'rssBefore should be positive');
    assert(typeof line.rssAfter === 'number' && line.rssAfter > 0, 'rssAfter should be positive');
    assert(typeof line.rssDelta === 'number', 'rssDelta should be a number');
    assert(typeof line.heapBefore === 'number' && line.heapBefore > 0, 'heapBefore should be positive');
    assert(typeof line.heapAfter === 'number' && line.heapAfter > 0, 'heapAfter should be positive');
    assert(typeof line.reportCount === 'number', 'reportCount should be a number');
    assert(line.fixCount === null || typeof line.fixCount === 'number', 'fixCount should be number or null');
    assert(line.runLintCalls === null || typeof line.runLintCalls === 'number', 'runLintCalls should be number or null');
    // notAppliedFixCount 仅 fix-mode 输出
    if (line.case === 'fix-mode') {
      assert(line.notAppliedFixCount === null || typeof line.notAppliedFixCount === 'number',
        'notAppliedFixCount should be number or null on fix-mode');
    }
    // Scanner index-build diagnostics: non-negative numbers (present on every case).
    assert(typeof line.textScannerIndexBuilds === 'number' && line.textScannerIndexBuilds >= 0,
      'textScannerIndexBuilds should be a non-negative number');
    assert(typeof line.textScannerIndexBuildWallTimeMs === 'number' && line.textScannerIndexBuildWallTimeMs >= 0,
      'textScannerIndexBuildWallTimeMs should be a non-negative number');
    assert(typeof line.run === 'number' && line.run >= 1, 'run should be >= 1');

    assert(VALID_CASES.has(line.case), `unknown case: ${line.case}`);
    assert(VALID_SHAPES.has(line.shape), `unknown shape: ${line.shape}`);

    // heapAfterGc should be numeric if present
    if (line.heapAfterGc !== null && line.heapAfterGc !== undefined) {
      assert(typeof line.heapAfterGc === 'number', 'heapAfterGc should be a number if present');
    }

    // nodeVersion should be a string like v24.x.x
    assert(typeof line.nodeVersion === 'string' && line.nodeVersion.startsWith('v'),
      'nodeVersion should start with "v"');
  }

  // Test 4: basic run with different shape
  console.log('  Running benchmark with 4 KiB many-paragraphs, 1 run...');
  result = await runBenchmark(['--bytes', '4096', '--shape', 'many-paragraphs', '--runs', '1', '--warmup', '0']);
  assert(result.code === 0, 'benchmark should exit 0');
  const lines2 = parseNDJSON(result.stdout);
  assert(lines2.length > 0, 'should output at least one line for many-paragraphs');

  // Test 5: noop case should have minimal RSS delta (informational, no hard assertion)
  const noopLines = lines.filter(l => l.case === 'noop');
  if (noopLines.length > 0) {
    console.log(`  noop baseline RSS delta: ${noopLines[0].rssDelta} bytes`);
  }

  // Test 6: profile-scanner-176.mjs 独立 smoke（#176 可复现数据脚本）
  console.log('  Running profile-scanner-176.mjs (many-small-nodes, 4 KiB, 1 run)...');
  const profileOut = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [
      path.join(SCRIPT_DIR, 'profile-scanner-176.mjs'),
      '--shape', 'many-small-nodes',
      '--bytes', '4096',
      '--runs', '1',
      '--warmup', '0',
    ], { cwd: path.resolve(SCRIPT_DIR, '..'), stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', (c) => { out += c; });
    child.stderr.on('data', (c) => { out += c; });
    child.on('close', code => resolve({ code, out }));
    child.on('error', reject);
  });
  assert(profileOut.code === 0, 'profile-scanner-176.mjs should exit 0');
  const profileLines = parseNDJSON(profileOut.out);
  assert(profileLines.length === 1, 'profile should output exactly one line');
  const pl = profileLines[0];
  assert(typeof pl.textNodeCount === 'number' && pl.textNodeCount > 0, 'profile textNodeCount should be > 0');
  assert(typeof pl.reportCount === 'number' && pl.reportCount > 0, 'profile reportCount should be > 0');
  assert(Array.isArray(pl.buildMsRuns) && pl.buildMsRuns.length === 1, 'profile buildMsRuns should have 1 entry');
  assert(Array.isArray(pl.wallMsRuns) && pl.wallMsRuns.length === 1, 'profile wallMsRuns should have 1 entry');
  assert(typeof pl.bytes === 'number' && pl.bytes > 0, 'profile bytes (actual) should be > 0');
  assert(typeof pl.requestedBytes === 'number' && pl.requestedBytes === 4096, 'profile requestedBytes should be 4096');

  console.log('\nSmoke test PASSED');
}

main().catch((err) => {
  console.error(`\nSmoke test FAILED: ${err.message}`);
  process.exit(1);
});
