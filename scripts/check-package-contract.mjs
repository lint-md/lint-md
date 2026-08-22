#!/usr/bin/env node
/**
 * Verify the published package contract against real builds and a real install.
 *
 * Run after `npm run build`:
 *   npm run package-contract
 *
 * Workspace checks:
 * 1. CJS entry loads with require() and exports the public API.
 * 2. Every relative specifier in emitted ESM carries an explicit extension.
 * 3. esm/package.json marks the directory as ES modules.
 * 4. The ESM entry loads with native import() and exposes the same API.
 *
 * Packed-install checks (mirrors issue #259 acceptance):
 * 5. npm pack output installs into a fresh consumer project.
 * 6. The installed package resolves and loads by name through CJS and native
 *    ESM, the @lint-md/eslint-plugin subpath still resolves, and TypeScript
 *    resolves the types.
 */

import { createRequire } from 'node:module';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import path from 'node:path';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const require = createRequire(import.meta.url);

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? root,
    encoding: 'utf8',
    timeout: options.timeoutMs ?? 180_000,
  });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} failed (${result.status}):\n${result.stdout ?? ''}\n${result.stderr ?? ''}`,
    );
  }
  return result;
}

// --- Workspace checks --------------------------------------------------------

const cjs = require(path.join(root, 'lib', 'index.js'));
if (typeof cjs.fixMarkdown !== 'function') {
  throw new TypeError('CJS entry does not export fixMarkdown');
}
if (typeof cjs.RuleExecutionFailure !== 'function') {
  throw new TypeError('CJS entry does not export RuleExecutionFailure');
}

async function listJsFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? listJsFiles(full) : Promise.resolve(full.endsWith('.js') ? [full] : []);
    }),
  );
  return files.flat();
}

const esmDir = path.join(root, 'esm');
for (const file of await listJsFiles(esmDir)) {
  const source = await readFile(file, 'utf8');
  const specifiers = [...source.matchAll(/(?:\bfrom|\bimport)\s*\(?\s*['"](\.[^'"]+)['"]/g)].map(
    match => match[1],
  );
  // Node ESM resolves relative specifiers literally. Only .js/.cjs/.mjs/.json load.
  const bad = specifiers.filter(spec => !/\.(?:js|cjs|mjs|json)$/.test(spec));
  if (bad.length > 0) {
    throw new Error(`${path.relative(root, file)} has specifiers Node cannot resolve:\n${bad.join('\n')}`);
  }
}

const esmPackageJson = JSON.parse(await readFile(path.join(esmDir, 'package.json'), 'utf8'));
if (esmPackageJson.type !== 'module') {
  throw new Error('esm/package.json must set {"type": "module"}');
}

const esm = await import(pathToFileURL(path.join(esmDir, 'index.js')));
for (const name of ['fixMarkdown', 'lintMarkdown', 'RuleExecutionFailure']) {
  if (typeof esm[name] !== 'function') {
    throw new TypeError(`ESM entry does not export ${name}`);
  }
}

console.log('[1/2] workspace checks OK');

// --- Packed-install checks ---------------------------------------------------

const workDir = await mkdtemp(path.join(tmpdir(), 'lint-md-core-contract-'));
try {
  const consumerDir = path.join(workDir, 'consumer');
  await mkdir(consumerDir);

  const packOutput = run('npm', ['pack', '--json', '--pack-destination', workDir]).stdout;
  const { filename } = JSON.parse(packOutput)[0];
  const tarball = path.join(workDir, filename);

  await writeFile(
    path.join(consumerDir, 'package.json'),
    `${JSON.stringify({ name: 'contract-consumer', private: true }, null, 2)}\n`,
  );

  run('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error', tarball], { cwd: consumerDir });

  run(process.execPath, [
    '-e',
    'const m = require(\'@lint-md/core\');'
      + 'if (typeof m.fixMarkdown !== \'function\' || typeof m.RuleExecutionFailure !== \'function\') {'
      + 'throw new TypeError(\'CJS entry incomplete\');}',
  ], { cwd: consumerDir });

  run(process.execPath, [
    '--input-type=module',
    '-e',
    'const m = await import(\'@lint-md/core\');'
      + 'if (typeof m.fixMarkdown !== \'function\' || typeof m.RuleExecutionFailure !== \'function\') {'
      + 'throw new TypeError(\'ESM entry incomplete\');}',
  ], { cwd: consumerDir });

  // Mirrors getTotalRuleNames() from lint-md/eslint-plugin src/utils.ts.
  run(process.execPath, [
    '-e',
    'const fs = require(\'fs\');'
      + 'const path = require(\'path\');'
      + 'const resolved = require.resolve(\'@lint-md/core/lib/rules/index\');'
      + 'const rules = fs.readdirSync(path.dirname(resolved));'
      + 'const names = rules.filter((file) => file.endsWith(\'.js\') && file !== \'index.js\');'
      + 'if (names.length === 0) { throw new TypeError("rules directory is empty"); }',
  ], { cwd: consumerDir });

  const tscBin = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');
  await writeFile(
    path.join(consumerDir, 'check.ts'),
    [
      'import { fixMarkdown } from \'@lint-md/core\';',
      '',
      'const result = fixMarkdown("# 标题 ", { rules: {} });',
      'console.log(result.lintResult.length);',
      '',
    ].join('\n'),
  );
  await writeFile(
    path.join(consumerDir, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          module: 'nodenext',
          moduleResolution: 'nodenext',
          target: 'esnext',
          strict: true,
          skipLibCheck: true,
          noEmit: true,
        },
        include: ['check.ts'],
      },
      null,
      2,
    )}\n`,
  );
  run(process.execPath, [tscBin, '-p', path.join(consumerDir, 'tsconfig.json')], { cwd: consumerDir });

  console.log(`[2/2] packed-install checks OK (${filename})`);
}
finally {
  await rm(workDir, { recursive: true, force: true });
}

console.log('Package contract OK');
