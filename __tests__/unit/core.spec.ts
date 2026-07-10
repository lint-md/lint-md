import { lintMarkdown } from '../../src';
import noEmptyCode from '../../src/rules/no-empty-code';
import { getExample } from '../utils/test-utils';
import { runLint } from '../../src/core/run-lint';
import { lintMarkdownInternal } from '../../src/core/lint-markdown';
import type { LintMdRule } from '../../src/types';

describe('test core methods for lint-markdown', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('test runLint() to lint source', () => {
    const lintResult = runLint(`# Hello

Some **importance**, and \`code\`.

\`\`\`javascript

\`\`\``, [
      {
        rule: noEmptyCode
      }
    ]);

    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(1);
    const res = lintResult.ruleManager.getReportData().pop();
    expect(res?.message).toStrictEqual('代码块内容不能为空，请删除空的代码块，或者填充代码内容');
  });

  test('test runLint() with empty rules array', () => {
    const lintResult = runLint('# Hello', []);
    expect(lintResult.ruleManager.getReportData().length).toBe(0);
  });

  test('test runLint() catches Error thrown by rule', () => {
    const throwingRule: LintMdRule = {
      meta: { name: 'throwing-rule' },
      create: () => ({
        text: () => {
          throw new Error('Test error from rule');
        }
      })
    };

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    runLint('hello world', [{ rule: throwingRule }]);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('rule execution error')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Test error from rule')
    );
  });

  test('test runLint() silently handles non-Error throws', () => {
    const throwingRule: LintMdRule = {
      meta: { name: 'throwing-string' },
      create: () => ({
        text: () => {
          // eslint-disable-next-line no-throw-literal
          throw 'string error';
        }
      })
    };

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    runLint('hello world', [{ rule: throwingRule }]);
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  test('test lintAndFixInternal() to lint or fix markdown source', () => {
    const res = lintMarkdownInternal(`# Hello

Some **importance**, and \`code\`.

\`\`\`javascript

\`\`\``, [
      {
        rule: noEmptyCode
      }
    ], true);

    expect(res.fixedResult?.notAppliedFixes).toStrictEqual([]);
    expect(res.fixedResult?.result).toMatchSnapshot();
  });

  test('test lintMarkdown() to lint or fix markdown source', () => {
    const example = getExample('docs-for-all-rules');
    const res = lintMarkdown(example);

    expect(res.fixedResult?.result).toMatchSnapshot();
  });

  test('notAppliedFixes accessible via lintMarkdown public API', () => {
    const ruleA: LintMdRule = {
      meta: { name: 'replace-to-x' },
      create: (ctx) => ({
        text: (node: any) => {
          if (node.value === 'abc') {
            ctx.report({
              loc: node.position,
              message: 'to X',
              fix: () => ({
                range: [node.position.start.offset, node.position.end.offset],
                text: 'X'
              })
            });
          }
        }
      })
    };

    const ruleB: LintMdRule = {
      meta: { name: 'replace-to-y' },
      create: (ctx) => ({
        text: (node: any) => {
          if (node.value === 'abc') {
            ctx.report({
              loc: node.position,
              message: 'to Y',
              fix: () => ({
                range: [node.position.start.offset, node.position.end.offset],
                text: 'Y'
              })
            });
          }
        }
      })
    };

    const res = lintMarkdown(
      'abc',
      { 'replace-to-x': [ruleA, 2, {}], 'replace-to-y': [ruleB, 2, {}] },
      true
    );

    expect(res.fixedResult).not.toBeNull();
    expect(res.fixedResult!.result).toBe('X');
    // ruleB's fix conflicts with ruleA's — should be in notAppliedFixes
    expect(res.fixedResult!.notAppliedFixes.length).toBe(1);
    expect(res.fixedResult!.notAppliedFixes[0].text).toBe('Y');
  });

  test('notAppliedFixes empty when no conflicts', () => {
    const ruleA: LintMdRule = {
      meta: { name: 'replace-foo' },
      create: (ctx) => ({
        text: (node: any) => {
          if (node.value === 'foo') {
            ctx.report({
              loc: node.position,
              message: 'replace foo',
              fix: () => ({
                range: [node.position.start.offset, node.position.end.offset],
                text: 'bar'
              })
            });
          }
        }
      })
    };

    const res = lintMarkdown(
      'foo',
      { 'replace-foo': [ruleA, 2, {}] },
      true
    );

    expect(res.fixedResult).not.toBeNull();
    expect(res.fixedResult!.result).toBe('bar');
    expect(res.fixedResult!.notAppliedFixes).toStrictEqual([]);
  });
});
