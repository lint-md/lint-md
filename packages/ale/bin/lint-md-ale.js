#!/usr/bin/env node

const fs = require('fs');
const { formatForAle } = require('../src/format');

function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => chunks.push(chunk));
    process.stdin.on('end', () => resolve(chunks.join('')));
    process.stdin.on('error', reject);
  });
}

async function main() {
  const fileArg = process.argv[2];
  let filePath;
  let markdown;

  if (fileArg && fileArg !== '--stdin') {
    filePath = fileArg;
    markdown = fs.readFileSync(filePath, 'utf-8');
  }
  else {
    filePath = 'stdin';
    markdown = await readStdin();
  }

  const { lintMarkdown } = require('@lint-md/core');
  const { lintResult } = lintMarkdown(markdown, {}, false);

  const hasError = lintResult.some(item => item.severity === 2);
  const output = formatForAle(lintResult, filePath);

  if (output) {
    process.stdout.write(output);
  }

  process.exit(hasError ? 1 : 0);
}

main().catch((err) => {
  process.stderr.write(`lint-md-ale error: ${err.message}\n`);
  process.exit(1);
});
