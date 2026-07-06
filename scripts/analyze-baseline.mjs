#!/usr/bin/env node
/**
 * Analyse NDJSON benchmark output from benchmark-memory.mjs.
 *
 * Groups by (shape, bytes, case, rule), computes median/min/max for key metrics,
 * prints a formatted table, then computes layered memory-attribution deltas.
 *
 * Usage:
 *   node scripts/benchmark-memory.mjs --bytes 1048576 --runs 5 > /tmp/baseline.ndjson
 *   node scripts/analyze-baseline.mjs /tmp/baseline.ndjson
 *   node scripts/benchmark-memory.mjs ... | node scripts/analyze-baseline.mjs
 */

import { readFileSync } from 'node:fs';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function safeMin(values) {
  if (values.length === 0) return null;
  return Math.min(...values);
}

function safeMax(values) {
  if (values.length === 0) return null;
  return Math.max(...values);
}

function formatBytes(n) {
  if (n === null || n === undefined) return 'N/A';
  if (n === 0) return '0 B';
  const abs = Math.abs(n);
  if (abs >= 1024 * 1024 * 1024) return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GiB`;
  if (abs >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MiB`;
  if (abs >= 1024) return `${(n / 1024).toFixed(2)} KiB`;
  return `${n} B`;
}

function formatMs(n) {
  if (n === null || n === undefined) return 'N/A';
  return `${Math.round(n)} ms`;
}

function formatPct(n) {
  if (n === null || n === undefined) return 'N/A';
  return `${n.toFixed(1)}%`;
}

function pad(str, len) { return String(str).padEnd(len); }

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const input = readFileSync(process.argv[2] || 0, 'utf8');
  const lines = input.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));

  console.log(`# Baseline analysis (${lines.length} runs)`);
  if (lines.length > 0) {
    const f = lines[0];
    console.log(`# Node: ${f.nodeVersion}  Platform: ${f.platform} ${f.arch}`);
  }
  console.log('');

  // Group by (shape, bytes, case, rule)
  const groups = new Map();
  for (const line of lines) {
    const key = `${line.shape}|${line.bytes}|${line.case}|${line.rule || ''}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(line);
  }

  // Print per-group table
  const cols = ['case', 'shape', 'bytes', 'rule', 'runs', 'rssΔ median', 'rssΔ min', 'rssΔ max', 'wall median', 'heapAfterGc median'];
  const colWidths = cols.map(c => c.length);

  const rows = [];
  for (const [key, items] of groups) {
    const [shape, bytesStr, caseName, rule] = key.split('|');
    const bytes = parseInt(bytesStr, 10);
    const rssDeltas = items.map(i => i.rssDelta).filter(v => v != null);
    const wallTimes = items.map(i => i.wallTimeMs).filter(v => v != null);
    const heapGcs = items.map(i => i.heapAfterGc).filter(v => v != null);

    rows.push({
      caseName,
      shape,
      bytes,
      rule: rule || '',
      runs: items.length,
      rssMedian: median(rssDeltas),
      rssMin: safeMin(rssDeltas),
      rssMax: safeMax(rssDeltas),
      wallMedian: median(wallTimes),
      heapGcMedian: median(heapGcs),
    });
  }

  // Sort: same shape together, then ascending bytes, then standard case order
  const caseOrder = ['noop', 'input-only', 'parser-only', 'parse-traverse', 'single-rule', 'all-rules', 'fix-mode'];
  rows.sort((a, b) => {
    if (a.shape !== b.shape) return a.shape.localeCompare(b.shape);
    if (a.bytes !== b.bytes) return a.bytes - b.bytes;
    return caseOrder.indexOf(a.caseName) - caseOrder.indexOf(b.caseName) || a.rule.localeCompare(b.rule);
  });

  for (const r of rows) {
    const vals = [
      r.caseName, r.shape, String(r.bytes), r.rule || '-', String(r.runs),
      formatBytes(r.rssMedian), formatBytes(r.rssMin), formatBytes(r.rssMax),
      formatMs(r.wallMedian), formatBytes(r.heapGcMedian),
    ];
    for (let i = 0; i < vals.length; i++) {
      colWidths[i] = Math.max(colWidths[i], String(vals[i]).length);
    }
  }

  // Header
  const header = cols.map((c, i) => pad(c, colWidths[i])).join(' | ');
  console.log(header);
  console.log('-'.repeat(header.length));

  for (const r of rows) {
    const vals = [
      r.caseName, r.shape, String(r.bytes), r.rule || '-', String(r.runs),
      formatBytes(r.rssMedian), formatBytes(r.rssMin), formatBytes(r.rssMax),
      formatMs(r.wallMedian), formatBytes(r.heapGcMedian),
    ];
    console.log(vals.map((v, i) => pad(String(v), colWidths[i])).join(' | '));
  }

  // ---- Layered delta per (shape, bytes) group ----
  console.log('\n## Layered deltas\n');

  const combos = new Map();
  for (const r of rows) {
    const key = `${r.shape}|${r.bytes}`;
    if (!combos.has(key)) combos.set(key, { shape: r.shape, bytes: r.bytes, cases: {} });
    const c = combos.get(key);
    if (r.caseName === 'single-rule') {
      if (!c.singleRuleRows) c.singleRuleRows = [];
      c.singleRuleRows.push(r);
    }
    c.cases[r.caseName] = r;
  }

  for (const [, combo] of combos) {
    console.log(`### ${combo.shape} ${combo.bytes} B (${formatBytes(combo.bytes)})`);

    const c = combo.cases;
    const inputOnly = c['input-only'];
    const parserOnly = c['parser-only'];
    const parseTraverse = c['parse-traverse'];
    const allRules = c['all-rules'];
    const fixMode = c['fix-mode'];

    const inputBase = inputOnly ? inputOnly.rssMedian : 0;
    const parserBase = parserOnly ? parserOnly.rssMedian : 0;
    const traverseBase = parseTraverse ? parseTraverse.rssMedian : 0;
    const allRulesBase = allRules ? allRules.rssMedian : 0;
    const totalDelta = allRulesBase - inputBase;

    // %total is always relative to (allRules - inputOnly); guard against 0/NaN
    const calcPct = (delta) => {
      if (Math.abs(totalDelta) < 1) return null;
      return delta / totalDelta * 100;
    };

    const rows2 = [];

    // parser delta
    if (inputOnly && parserOnly) {
      rows2.push({ label: 'parser            ', delta: parserBase - inputBase, pct: calcPct(parserBase - inputBase), wall: parserOnly.wallMedian, formula: 'parser-only − input-only' });
    }

    // traverser delta
    if (parserOnly && parseTraverse) {
      rows2.push({ label: 'traverser         ', delta: traverseBase - parserBase, pct: calcPct(traverseBase - parserBase), wall: parseTraverse.wallMedian - parserOnly.wallMedian, formula: 'parse-traverse − parser-only' });
    }

    // single-rule deltas
    if (combo.singleRuleRows && parseTraverse) {
      for (const sr of combo.singleRuleRows) {
        rows2.push({ label: `single-rule [${sr.rule}]`, delta: sr.rssMedian - traverseBase, pct: calcPct(sr.rssMedian - traverseBase), wall: sr.wallMedian - parseTraverse.wallMedian, formula: `${sr.rule} − parse-traverse` });
      }
    }

    // all-rules delta
    if (parseTraverse && allRules) {
      rows2.push({ label: 'all-rules         ', delta: allRulesBase - traverseBase, pct: calcPct(allRulesBase - traverseBase), wall: allRules.wallMedian - parseTraverse.wallMedian, formula: 'all-rules − parse-traverse' });
    }

    // fix-mode delta
    if (allRules && fixMode) {
      rows2.push({ label: 'fix-mode          ', delta: fixMode.rssMedian - allRulesBase, pct: calcPct(fixMode.rssMedian - allRulesBase), wall: fixMode.wallMedian - allRules.wallMedian, formula: 'fix-mode − all-rules' });
    }

    if (rows2.length === 0) continue;

    // Print total
    console.log(`  total (all-rules − input-only): ${formatBytes(totalDelta)} ${formatMs(allRules ? allRules.wallMedian : 0)}`);
    console.log('');

    const col2w = [28, 12, 8, 12];
    const header2 = ['layer', 'rssΔ', '%total', 'wallΔ'].map((s, i) => pad(s, col2w[i])).join(' | ');
    console.log('  ' + header2);
    console.log('  ' + '-'.repeat(header2.length));

    for (const r2 of rows2) {
      const vals = [r2.label, formatBytes(r2.delta), formatPct(r2.pct), formatMs(r2.wall)];
      console.log('  ' + vals.map((s, i) => pad(s, col2w[i])).join(' | '));
    }

    // Decision guidance
    console.log('');
    if (inputOnly && parserOnly && allRules) {
      if (Math.abs(totalDelta) < 1024 * 1024) {
        console.log('  → Decision: total RSS delta too small/noisy → collect more runs or inspect profiles');
      } else {
        const parserPct = (parserBase - inputBase) / totalDelta * 100;
        const rulesPct = (allRulesBase - traverseBase) / totalDelta * 100;
        console.log(`  → parser contributes ${parserPct.toFixed(0)}% of total delta`);
        console.log(`  → rules contribute  ${rulesPct.toFixed(0)}% of total delta`);

        if (parserPct >= 70) {
          console.log('  → Decision: parser dominates → Phase 3B (parser optimization)');
        } else if (rulesPct >= 20) {
          console.log('  → Decision: rules dominate → Phase 3A (text-rule optimization)');
        } else {
          console.log('  → Decision: evenly distributed → profile both before deciding');
        }
      }
    }

    // Live heap after GC
    if (allRules) {
      console.log(`  → live heap (all-rules, after GC): ${formatBytes(allRules.heapGcMedian)}`);
      console.log(`  → RSS (all-rules): ${formatBytes(allRules.rssMedian)}`);
    }
    console.log('');
  }
}

main();
