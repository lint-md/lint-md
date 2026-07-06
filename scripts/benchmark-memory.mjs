#!/usr/bin/env node
/**
 * Core memory benchmark for @lint-md/core.
 *
 * Usage:
 *   npm run build
 *   node scripts/benchmark-memory.mjs [--bytes 1048576] [--shape long-paragraph] [--runs 5]
 *
 * Output: NDJSON with one line per measurement run.
 *
 * When BENCHMARK_CHILD=1 is set, runs a single case in a child process
 * (spawned by the parent) and outputs one JSON line.
 *
 * CLI params (parent mode):
 *   --bytes <n>       Input size in bytes per case (default: 65536)
 *   --shape <name>    Input shape: long-paragraph | many-paragraphs | mixed-markdown |
 *                     high-match-density | low-match-density | overlapping-fixes
 *                     (default: long-paragraph)
 *   --runs <n>        Measured runs per case (default: 5)
 *   --warmup <n>      Warmup runs before measurement (default: 2)
 *   --all             Run all shape+size combinations
 *   -h, --help        Show this help
 */

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);

// Shared constants (must be above child-mode block for TDZ in ESM)
const CHINESE_CHARS = '的一是在不了有和人这中大为上个国以要到和自地们时生就学对得也子说着可';
const ENGLISH_WORDS = 'the be to of and a in that have I it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us'.split(' ');

// ---------------------------------------------------------------------------
// Child mode
// ---------------------------------------------------------------------------
if (process.env.BENCHMARK_CHILD === '1') {
  const shape = process.env.BENCHMARK_SHAPE;
  const bytes = parseInt(process.env.BENCHMARK_BYTES, 10);
  const caseName = process.env.BENCHMARK_CASE;
  const ruleName = process.env.BENCHMARK_RULE || '';
  const warmupCount = parseInt(process.env.BENCHMARK_WARMUP || '0', 10);

  const { input } = generateInput(shape, bytes);

  // Use CJS build (ESM build has extensionless imports that break Node.js resolution)
  const require_ = createRequire(import.meta.url);
  const { parseMd } = require_('@lint-md/parser');
  const core = require_('../lib/index.js');
  const { runLint } = require_('../lib/core/run-lint.js');

  const TEXT_RULE_IMPORTS = {
    'space-around-alphabet': () => core.spaceAroundAlphabet,
    'space-around-number': () => core.spaceAroundNumber,
    'no-full-width-number': () => core.noFullWidthNumber,
    'no-half-width-punctuation': () => core.noHalfWidthPunctuation,
    'use-standard-ellipsis': () => core.useStandardEllipsis,
    'no-special-characters': () => core.noSpecialCharacters,
    'no-space-in-inline-code': () => core.noSpaceInInlineCode,
    'no-space-in-link': () => core.noSpaceInLink,
    'correct-title-trailing-punctuation': () => core.correctTitleTrailingPunctuation,
  };

  function runNoop() {
    return { reportCount: 0, fixCount: 0, runLintCalls: 0 };
  }

  function runInputOnly() {
    const s = input.slice(0);
    void s;
    return { reportCount: 0, fixCount: 0, runLintCalls: 0 };
  }

  function runParserOnly() {
    parseMd(input);
    return { reportCount: 0, fixCount: 0, runLintCalls: 0 };
  }

  function runParseTraverse() {
    const result = runLint(input, []);
    const reports = result.ruleManager.getReportData();
    return { reportCount: reports.length, fixCount: 0, runLintCalls: 1 };
  }

  function runSingleRule() {
    const ruleFactory = TEXT_RULE_IMPORTS[ruleName];
    if (!ruleFactory) throw new Error(`Unknown rule: ${ruleName}`);
    const result = runLint(input, [{ rule: ruleFactory() }]);
    const reports = result.ruleManager.getReportData();
    const fixes = result.ruleManager.getAllFixes();
    return { reportCount: reports.length, fixCount: fixes.length, runLintCalls: 1 };
  }

  function runAllRules() {
    const result = core.lintMarkdown(input, {}, false);
    // lintMarkdown strips fix from public lintResult.
    // fixCount will be available via fixableErrorCount+fixableWarningCount once PR #162 lands.
    return {
      reportCount: (result.lintResult || []).length,
      fixCount: null,
      runLintCalls: 1,
    };
  }

  function runFixMode() {
    const result = core.lintMarkdown(input, {}, true);
    return {
      reportCount: (result.lintResult || []).length,
      fixCount: null,
      runLintCalls: null, // handleFixMode may loop internally; exact count unknown here
    };
  }

  const runners = {
    noop: runNoop,
    'input-only': runInputOnly,
    'parser-only': runParserOnly,
    'parse-traverse': runParseTraverse,
    'single-rule': runSingleRule,
    'all-rules': runAllRules,
    'fix-mode': runFixMode,
  };

  const runner = runners[caseName];
  if (!runner) throw new Error(`Unknown case: ${caseName}`);

  // Warmup
  for (let i = 0; i < warmupCount; i++) {
    runner();
    if (typeof global.gc === 'function') global.gc();
  }

  // Measure
  const rssBefore = process.memoryUsage.rss();
  const heapBefore = process.memoryUsage().heapUsed;
  const start = performance.now();

  const counts = runner();

  const end = performance.now();
  const rssAfter = process.memoryUsage.rss();
  const heapAfter = process.memoryUsage().heapUsed;
  // process.resourceUsage().maxRSS is in KiB; convert to bytes for consistency
  const maxRssBytes = process.resourceUsage().maxRSS * 1024;

  let heapAfterGc = null;
  if (typeof global.gc === 'function') {
    global.gc();
    heapAfterGc = process.memoryUsage().heapUsed;
  }

  const result = {
    case: caseName,
    shape,
    bytes,
    rule: ruleName || undefined,
    wallTimeMs: Math.round(end - start),
    maxRss: maxRssBytes,
    rssBefore,
    rssAfter,
    rssDelta: rssAfter - rssBefore,
    heapBefore,
    heapAfter,
    heapAfterGc,
    ...counts,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    timestamp: new Date().toISOString(),
  };

  process.stdout.write(JSON.stringify(result) + '\n');
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Parent mode
// ---------------------------------------------------------------------------

function printHelp() {
  console.log(`Usage: node benchmark-memory.mjs [options]

Options:
  --bytes <n>       Input size in bytes (default: 65536)
  --shape <name>    Input shape (default: long-paragraph)
                    Shapes: long-paragraph | many-paragraphs | mixed-markdown |
                            high-match-density | low-match-density | overlapping-fixes
  --runs <n>        Measured runs per case (default: 5)
  --warmup <n>      Warmup runs per child process (default: 2)
  --all             Run all shape+size combinations
  -h, --help        Show this help

Examples:
  node scripts/benchmark-memory.mjs --bytes 1048576 --shape long-paragraph --runs 5
  node scripts/benchmark-memory.mjs --all --runs 3

Environment:
  BENCHMARK_CHILD=1  Internal flag for child process mode (do not set manually).
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { bytes: 65536, shape: 'long-paragraph', runs: 5, warmup: 2, all: false };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
    case '-h': case '--help': printHelp(); process.exit(0);
    case '--bytes': opts.bytes = parseInt(args[++i], 10); break;
    case '--shape': opts.shape = args[++i]; break;
    case '--runs': opts.runs = parseInt(args[++i], 10); break;
    case '--warmup': opts.warmup = parseInt(args[++i], 10); break;
    case '--all': opts.all = true; break;
    default: console.error(`Unknown flag: ${args[i]}\n`); printHelp(); process.exit(1);
    }
  }
  return opts;
}

// Run a single case measurement in a child process.
// Returns a Promise that resolves with the parsed JSON result object.
function runChildCase(opts) {
  const { shape, bytes, caseName, ruleName, warmup } = opts;
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [
      '--expose-gc',
      SCRIPT_PATH,
    ], {
      env: {
        ...process.env,
        BENCHMARK_CHILD: '1',
        BENCHMARK_SHAPE: shape,
        BENCHMARK_BYTES: String(bytes),
        BENCHMARK_CASE: caseName,
        BENCHMARK_RULE: ruleName || '',
        BENCHMARK_WARMUP: String(warmup || 0),
        NODE_NO_WARNINGS: '1',
      },
      stdio: ['ignore', 'pipe', 'inherit'],
      cwd: process.cwd(),
    });

    let stdout = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) reject(new Error(`Child exited with code ${code}`));
      else {
        try { resolve(JSON.parse(stdout.trim())); }
        catch (e) { reject(new Error(`Failed to parse child output: ${e.message}\n${stdout}`)); }
      }
    });
  });
}

// Shapes and sizes for all-combinations mode
const ALL_SHAPES = [
  'long-paragraph', 'many-paragraphs', 'mixed-markdown',
  'high-match-density', 'low-match-density', 'overlapping-fixes',
];
const ALL_SIZES = [64 * 1024, 256 * 1024, 1024 * 1024];

// Text rules for single-rule benchmarking
const TEXT_RULES = [
  'space-around-alphabet',
  'space-around-number',
  'no-full-width-number',
  'no-half-width-punctuation',
];

// Measurement scenarios in order
const CASES = [
  'noop',
  'input-only',
  'parser-only',
  'parse-traverse',
  'single-rule',
  'all-rules',
  'fix-mode',
];

// ---------------------------------------------------------------------------
// Input generators
// ---------------------------------------------------------------------------

function repeatToSize(base, targetBytes) {
  const buf = Buffer.from(base, 'utf8');
  const times = Math.ceil(targetBytes / buf.length);
  return Buffer.concat(Array(times).fill(buf)).slice(0, targetBytes).toString('utf8');
}

function generateLongParagraph(targetBytes) {
  const base = '这是用于性能测试的长段落文本，包含中英文混合内容 test content and numbers 1234567890 以及标点符号。' +
    CHINESE_CHARS.repeat(10) + ' ' + ENGLISH_WORDS.slice(0, 20).join(' ') + '。';
  return repeatToSize(base, targetBytes);
}

function generateManyParagraphs(targetBytes) {
  // Generate many short paragraphs, each with a heading + paragraph pattern.
  const parts = [];
  let acc = 0;
  let i = 0;
  while (acc < targetBytes) {
    const p = `## 第${i + 1}个段落标题\n\n这是第${i + 1}个段落的正文内容。` +
      `包含一些中文文本和 English words mixed together。\n\n`;
    const buf = Buffer.from(p, 'utf8');
    if (acc + buf.length > targetBytes) {
      parts.push(buf.slice(0, targetBytes - acc));
      break;
    }
    parts.push(buf);
    acc += buf.length;
    i++;
  }
  return Buffer.concat(parts).toString('utf8');
}

function generateMixedMarkdown(targetBytes) {
  const templates = [
    '# 一级标题\n\n这是一段**粗体**和*斜体*混合的段落文字。\n\n',
    '- 列表项 1：包含 [链接](https://example.com)\n- 列表项 2：包含 `inline code`\n\n',
    '> 这是一段引用文字，\n> 包含多行内容。\n\n',
    '```javascript\nconst x = 1;\nconsole.log(x);\n```\n\n',
    '| 表头 A | 表头 B |\n|--------|--------|\n| cell 1 | cell 2 |\n\n',
    '![图片](https://example.com/img.png)\n\n',
  ];
  const parts = [];
  let acc = 0; let i = 0;
  while (acc < targetBytes) {
    const t = templates[i % templates.length];
    const buf = Buffer.from(t, 'utf8');
    if (acc + buf.length > targetBytes) {
      parts.push(buf.slice(0, targetBytes - acc));
      break;
    }
    parts.push(buf);
    acc += buf.length;
    i++;
  }
  return Buffer.concat(parts).toString('utf8');
}

function generateHighMatchDensity(targetBytes) {
  // Lots of Chinese + English adjacent text to trigger space-around-alphabet etc.
  const base = '中文English中文123中文abc测试中文x' + CHINESE_CHARS.slice(0, 5);
  return repeatToSize(base, targetBytes);
}

function generateLowMatchDensity(targetBytes) {
  // Plain English text — most Chinese rules won't fire.
  const base = 'This is plain English text for low match density testing. ' +
    ENGLISH_WORDS.join(' ') + '. ';
  return repeatToSize(base, targetBytes);
}

function generateOverlappingFixes(targetBytes) {
  // Content that triggers fixes whose ranges may overlap (e.g. many space insertions).
  const base = '中文English中文123中文,测试中文;测试中文:测试中文(测试)中文！测试？测试。' + CHINESE_CHARS.slice(0, 5);
  return repeatToSize(base, targetBytes);
}

function generateInput(shape, bytes) {
  const generators = {
    'long-paragraph': generateLongParagraph,
    'many-paragraphs': generateManyParagraphs,
    'mixed-markdown': generateMixedMarkdown,
    'high-match-density': generateHighMatchDensity,
    'low-match-density': generateLowMatchDensity,
    'overlapping-fixes': generateOverlappingFixes,
  };
  const gen = generators[shape];
  if (!gen) throw new Error(`Unknown shape: ${shape}`);
  return { input: gen(bytes), shape, bytes };
}

// ---------------------------------------------------------------------------
// Main (parent mode)
// ---------------------------------------------------------------------------

async function main() {
  const opts = parseArgs();

  const shapes = opts.all ? ALL_SHAPES : [opts.shape];
  const sizes = opts.all ? ALL_SIZES : [opts.bytes];

  for (const shape of shapes) {
    for (const bytes of sizes) {
      for (const caseName of CASES) {
        if (caseName === 'single-rule') {
          // Single-rule cases: run each text rule separately
          for (const ruleName of TEXT_RULES) {
            for (let run = 0; run < opts.runs; run++) {
              const result = await runChildCase({
                shape, bytes, caseName, ruleName, warmup: opts.warmup,
              });
              result.run = run + 1;
              process.stdout.write(JSON.stringify(result) + '\n');
            }
          }
        } else {
          for (let run = 0; run < opts.runs; run++) {
            const result = await runChildCase({
              shape, bytes, caseName, ruleName: '', warmup: opts.warmup,
            });
            result.run = run + 1;
            process.stdout.write(JSON.stringify(result) + '\n');
          }
        }
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
