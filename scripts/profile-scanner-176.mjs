#!/usr/bin/env node
/**
 * Issue #176 可复现 profile：测量 TextScanner 换行索引构建成本占 lint 总耗时的比例。
 *
 * 设计目的（回应评审 P1）：所有输入、计数方式与原始数据都必须可复现。
 * - 输入复用 benchmark-memory.mjs 的已提交生成器（generateLongParagraph /
 *   generateManyParagraphs / generateHighMatchDensity / generateOverlappingFixes），
 *   并额外提供 many-small-nodes（大量独立短文本节点，最坏情况）。
 * - 文本节点数由 parseMd 直接统计（递归计数 type==='text'）。
 * - 默认 benchmark 输入不会触发索引构建（forEachChar 路径），因此本脚本的输入
 *   显式包含能触发 findAllMatches/findAllOccurrences（→ matchAt → lineBreakIndices）
 *   的字符：省略号 ....、全角数字 ０-９、特殊字符 ×÷。
 * - 每条 case 输出 1 行 NDJSON（含 warmup 前的原始逐 run 值），中位数由下游或
 *   人工按 run 序列计算，方法见 README 注释。
 *
 * 用法：
 *   node scripts/profile-scanner-176.mjs                       # 默认 256KiB × 5 runs × 2 warmup
 *   node scripts/profile-scanner-176.mjs --bytes 1048576 --runs 7 --warmup 3
 *   node scripts/profile-scanner-176.mjs --shape many-small-nodes
 *
 * 输出字段：
 *   shape, triggerInput, bytes, runs, warmup,
 *   textNodeCount, reportCount,
 *   buildMsRuns[]      —— 每次正式 run 的 indexBuildWallTimeMs（微秒级）
 *   wallMsRuns[]       —— 每次正式 run 的 lint 总耗时
 *   buildMsMedian, wallMsMedian, ratioPctMedian
 */

import { createRequire } from 'node:module';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require_ = createRequire(import.meta.url);
const { parseMd } = require_('@lint-md/parser');
const { runLint } = require_(path.resolve(__dirname, '../lib/core/run-lint.js'));
const scannerDiag = require_(path.resolve(__dirname, '../lib/utils/text-scanner.js'));

// 从已提交的 benchmark 文件抽取生成器，保证输入与 CI 一致、可复现。
const benchSrc = fs.readFileSync(path.resolve(__dirname, 'benchmark-memory.mjs'), 'utf8');
function extractGenerator(name) {
  const re = new RegExp(`function ${name}\\(targetBytes\\)[\\s\\S]*?\\n}\\n`);
  const m = benchSrc.match(re);
  if (!m)
    throw new Error(`cannot extract generator: ${name}`);
  // 生成器依赖模块级常量，在此提供同一份定义并整体 eval，供生成器闭包引用。
  const helperSrc = `
    const CHINESE_CHARS = '的一是在不了有和人这中大为上个国以要到和自地们时生就学对得也子说着可';
    const ENGLISH_WORDS = 'the be to of and a in that have I it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us'.split(' ');
    const repeatToSize = (base, targetBytes) => {
      const buf = Buffer.from(base, 'utf8');
      const times = Math.ceil(targetBytes / buf.length);
      return Buffer.concat(Array(times).fill(buf)).slice(0, targetBytes).toString('utf8');
    };
    return (${m[0]});
  `;
  // eslint-disable-next-line no-eval
  return eval(`(function () {${helperSrc}})()`);
}

const GENERATORS = {
  'long-paragraph': extractGenerator('generateLongParagraph'),
  'many-paragraphs': extractGenerator('generateManyParagraphs'),
  'high-match-density': extractGenerator('generateHighMatchDensity'),
  'overlapping-fixes': extractGenerator('generateOverlappingFixes'),
};

// 最坏情况：大量独立短文本节点，每个节点都会触发一次索引构建。
// 复用 generateManyParagraphs 的「标题+段落」结构，但内容显式包含触发字符。
function generateManySmallNodes(targetBytes) {
  const base = '段落测试.... 价格０元 计算×÷ abc123,测试;中文:测试(中文)中文！测试？测试。';
  const parts = [];
  let acc = 0;
  let i = 0;
  while (acc < targetBytes) {
    const p = `## ${i + 1}\n\n${base}\n\n`;
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
GENERATORS['many-small-nodes'] = generateManySmallNodes;

// 触发索引构建的字符补丁：把默认输入中不触发构建的内容替换为会触发的版本。
// 仅用于让 text-scanner-rules 真正走到 matchAt（positionAt → lineBreakIndices）。
function withTriggerChars(md) {
  return md
    .replace(/[0-9]+/g, '０-９') // 半角数字 → 全角，触发 no-full-width-number
    .replace(/\.\.\.+/g, '....') // 保证省略号触发 use-standard-ellipsis
    .replace(/\+/g, '×') // 触发 no-special-characters
    .replace(/-/g, '÷');
}

const RULE_IMPORTS = {
  'use-standard-ellipsis': () => require_(path.resolve(__dirname, '../lib/rules/use-standard-ellipsis.js')).default,
  'no-half-width-punctuation': () => require_(path.resolve(__dirname, '../lib/rules/no-half-width-punctuation.js')).default,
  'no-full-width-number': () => require_(path.resolve(__dirname, '../lib/rules/no-full-width-number.js')).default,
  'space-around-number': () => require_(path.resolve(__dirname, '../lib/rules/space-around-number.js')).default,
  'no-special-characters': () => require_(path.resolve(__dirname, '../lib/rules/no-special-characters.js')).default,
};
const SCANNER_RULE_NAMES = Object.keys(RULE_IMPORTS);
const SCANNER_CONFIGS = SCANNER_RULE_NAMES.map(n => ({ rule: RULE_IMPORTS[n]() }));

function countTextNodes(ast) {
  let n = 0;
  (function walk(x) {
    if (!x || typeof x !== 'object')
      return;
    if (x.type === 'text')
      n++;
    if (Array.isArray(x.children))
      x.children.forEach(walk);
  })(ast);
  return n;
}

function median(arr) {
  const b = [...arr].sort((x, y) => x - y);
  const m = b.length >> 1;
  return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2;
}

function parseArgs(argv) {
  const opts = { bytes: 256 * 1024, runs: 5, warmup: 2, shape: null };
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--bytes': opts.bytes = parseInt(argv[++i], 10); break;
      case '--runs': opts.runs = parseInt(argv[++i], 10); break;
      case '--warmup': opts.warmup = parseInt(argv[++i], 10); break;
      case '--shape': opts.shape = argv[++i]; break;
      default: break;
    }
  }
  return opts;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));

  // 用固定 seed 的可复现输入：内容固定，仅按 bytes 截断，因此同一 commit 必得同一输入。
  const shapes = opts.shape ? [opts.shape] : Object.keys(GENERATORS);
  const allLines = [];

  for (const shape of shapes) {
    const gen = GENERATORS[shape];
    // 注意顺序：先生成 + 触发字符替换，最后再统计实际被测输入。
    // withTriggerChars 会改变 UTF-8 字节长度与潜在 AST 结构，因此
    // 字节数与文本节点数都必须取自转换后的 triggeredMd（回应 P1/P2）。
    const sourceMd = gen(opts.bytes);
    const triggeredMd = withTriggerChars(sourceMd);
    const actualBytes = Buffer.byteLength(triggeredMd, 'utf8');
    const textNodeCount = countTextNodes(parseMd(triggeredMd));

    const buildMsRuns = [];
    const wallMsRuns = [];
    let reportCount = 0;

    for (let i = 0; i < opts.warmup + opts.runs; i++) {
      scannerDiag.resetScannerDiagnostics();
      const t0 = performance.now();
      const result = runLint(triggeredMd, SCANNER_CONFIGS);
      const wall = performance.now() - t0;
      const d = scannerDiag.getScannerDiagnostics();
      reportCount = result.ruleManager.getReportData().length;
      if (i >= opts.warmup) {
        buildMsRuns.push(d.textScannerIndexBuildWallTimeMs);
        wallMsRuns.push(wall);
      }
    }

    const buildMsMedian = median(buildMsRuns);
    const wallMsMedian = median(wallMsRuns);
    const ratioPctMedian = wallMsMedian > 0 ? (buildMsMedian / wallMsMedian) * 100 : 0;

    const line = {
      shape,
      triggerInput: true,
      requestedBytes: opts.bytes,
      bytes: actualBytes,
      runs: opts.runs,
      warmup: opts.warmup,
      textNodeCount,
      reportCount,
      buildMsRuns: buildMsRuns.map(v => Number(v.toFixed(4))),
      wallMsRuns: wallMsRuns.map(v => Number(v.toFixed(3))),
      buildMsMedian: Number(buildMsMedian.toFixed(4)),
      wallMsMedian: Number(wallMsMedian.toFixed(3)),
      ratioPctMedian: Number(ratioPctMedian.toFixed(3)),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    };
    allLines.push(line);
  }

  // 原始 NDJSON：每行一个 shape，run 级原始值可复算中位数。
  for (const l of allLines) process.stdout.write(`${JSON.stringify(l)}\n`);
}

main();
