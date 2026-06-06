#!/usr/bin/env node

const fs = require('fs');

function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => chunks.push(chunk));
    process.stdin.on('end', () => resolve(chunks.join('')));
    process.stdin.on('error', reject);
  });
}

function mapSeverity(severity) {
  switch (severity) {
    case 2:
      return 'E';
    case 1:
      return 'W';
    default:
      return 'I';
  }
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

  const { lintMarkdown } = require('../lib');
  const { lintResult } = lintMarkdown(markdown, {}, false);

  let hasError = false;
  const lines = lintResult.map((item) => {
    if (item.severity === 2) {
      hasError = true;
    }
    const type = mapSeverity(item.severity);
    return `${filePath}:${item.loc.start.line}:${item.loc.start.column}: ${type} ${item.name}: ${item.message}`;
  });

  if (lines.length) {
    process.stdout.write(`${lines.join('\n')}\n`);
  }

  process.exit(hasError ? 1 : 0);
}

main().catch((err) => {
  process.stderr.write(`lint-md-ale error: ${err.message}\n`);
  process.exit(1);
});
