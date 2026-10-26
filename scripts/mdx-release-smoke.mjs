#!/usr/bin/env node

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { compile } from '@mdx-js/mdx';

if (process.argv.includes('--help')) {
  process.stdout.write('Run npm run build, then npm run test:mdx-release.\n');
  process.exit(0);
}

const require = createRequire(import.meta.url);
const baseline = require('lint-md-core-2-5-3');
const markdownCjs = require('@lint-md/core');
const mdxCjs = require('@lint-md/core/mdx');
const markdownEsm = await import('@lint-md/core');
const mdxEsm = await import('@lint-md/core/mdx');

const rules = {
  'no-multiple-blank-lines': 2,
  'space-around-alphabet': 2,
  'no-half-width-punctuation': 2
};

const withoutMetrics = (result) => {
  if (!result.fixedResult) {
    return result;
  }
  const fixedResult = { ...result.fixedResult };
  delete fixedResult.metrics;
  return { ...result, fixedResult };
};

const markdown = '# 中文English标题\n\n\n中文(test)中文';
const markdownOptions = { rules };
const baselineLint = baseline.lintMarkdown(markdown, markdownOptions);
const baselineFix = baseline.fixMarkdown(markdown, markdownOptions);

for (const entry of [markdownCjs, markdownEsm]) {
  assert.deepEqual(entry.lintMarkdown(markdown, markdownOptions), baselineLint);
  assert.deepEqual(
    withoutMetrics(entry.fixMarkdown(markdown, markdownOptions)),
    withoutMetrics(baselineFix)
  );
}

const newline = '\r\n';
const esm = ['export const message = `第一行', '', '', '第三行`'].join(newline);
const jsxOpen = '<Card label="保留  两个空格" code={message}>';
const textExpression = '正文 {message} 结尾';
const flowExpression = ['{`第一行', '', '', '第三行`}'].join(newline);
const source = [
  esm,
  '',
  '',
  '',
  '# 中文English标题',
  '',
  '',
  jsxOpen,
  '中文&#40;test&#41;中文',
  '中文\\(test\\)中文',
  textExpression,
  '</Card>',
  '',
  '',
  '',
  flowExpression
].join(newline);
const pointAt = (offset) => {
  const prefix = source.slice(0, offset);
  const lastBreak = prefix.lastIndexOf(newline);
  return {
    line: prefix.split(newline).length,
    column: offset - (lastBreak < 0 ? 0 : lastBreak + newline.length) + 1,
    offset
  };
};
const expectedPunctuationRanges = ['&#40;', '&#41;', '\\(', '\\)']
  .map(raw => [source.indexOf(raw), source.indexOf(raw) + raw.length]);

for (const entry of [mdxCjs, mdxEsm]) {
  const lint = entry.lintMdx(source, { rules });
  const ranges = lint.diagnostics
    .filter(item => item.ruleId === 'no-half-width-punctuation')
    .map(item => item.range);
  assert.deepEqual(ranges, expectedPunctuationRanges.map(([start, end]) => ({
    start: pointAt(start),
    end: pointAt(end)
  })));

  const first = entry.fixMdx(source, { rules });
  const fixed = first.fixedResult.result;
  assert.equal(first.complete, true);
  assert.deepEqual(first.remainingDiagnostics, []);
  assert.equal(first.fixedResult.convergence, 'stable');
  assert.ok(first.fixedResult.rounds > 1);

  for (const fragment of [esm, jsxOpen, textExpression, flowExpression]) {
    assert.ok(Buffer.from(fixed).includes(Buffer.from(fragment)));
  }
  assert.ok(fixed.includes('# 中文 English 标题'));
  assert.ok(fixed.includes('中文（test）中文'));
  assert.ok(!fixed.includes(`${newline}${newline}${newline}${newline}#`));

  await compile(fixed, { format: 'mdx' });

  const second = entry.fixMdx(fixed, { rules });
  assert.equal(second.fixedResult.result, fixed);
  assert.deepEqual(second.remainingDiagnostics, []);
  assert.equal(second.fixedResult.rounds, 1);
}

const roundRule = {
  meta: { name: 'mdx-round' },
  create: context => ({
    mdxJsxTextElement(node) {
      context.report({ loc: node.position, message: 'MDX element remains' });
      if (!context.markdown.includes('中文 ABC 待完成')) {
        return;
      }
      const start = context.markdown.indexOf('待完成', node.position.start.offset);
      context.report({
        range: [start, start + '待完成'.length],
        message: 'Finish the second round',
        fix: fixer => fixer.replaceTextRange([start, start + '待完成'.length], '已完成')
      });
    }
  })
};
for (const entry of [mdxCjs, mdxEsm]) {
  const roundResult = entry.fixMdx('<Card>中文ABC待完成</Card>', {
    rules: {
      'space-around-alphabet': 2,
      'mdx-round': [roundRule, 2, {}]
    }
  });
  assert.equal(roundResult.fixedResult.result, '<Card>中文 ABC 已完成</Card>');
  assert.equal(roundResult.fixedResult.rounds, 3);
  assert.deepEqual(
    roundResult.remainingDiagnostics.map(item => item.ruleId),
    ['mdx-round']
  );
}

const corruptMapRule = {
  meta: { name: 'corrupt-map' },
  create: context => ({
    text(node) {
      node.value = `${node.value}!`;
      context.sourceCode.getTextRange(node, 0, 1);
    }
  })
};
const parserCjs = require('@lint-md/parser');
const parserMdxCjs = require('@lint-md/parser/mdx');
const parserEsm = await import('@lint-md/parser');
const parserMdxEsm = await import('@lint-md/parser/mdx');
for (const [entry, markdownError, mdxError] of [
  [mdxCjs, parserCjs.SourceMapError, parserMdxCjs.SourceMapError],
  [mdxEsm, parserEsm.SourceMapError, parserMdxEsm.SourceMapError]
]) {
  assert.notEqual(markdownError, mdxError);
  assert.throws(
    () => entry.lintMdx('中文ABC', {
      rules: { 'corrupt-map': [corruptMapRule, 2, {}] }
    }),
    (error) => {
      assert.equal(error.code, 'ERR_SOURCE_MAP_CONSISTENCY');
      assert.ok(error instanceof mdxError);
      assert.ok(!(error instanceof markdownError));
      return true;
    }
  );
}

process.stdout.write('MDX release smoke test OK\n');
