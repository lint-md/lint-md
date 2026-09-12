import { RULE_SEVERITY, lintMarkdown } from '../../src';
import { lintMarkdownInternal } from '../../src/core/lint-markdown';
import { runLint } from '../../src/core/run-lint';
import type { LintMdRule } from '../../src/types';

describe('execution report boundary', () => {
  test('materializes legacy content only for the initial fix round', () => {
    const rule: LintMdRule = {
      meta: { name: 'round-boundary' },
      create: context => ({
        root: () => context.report({
          range: [0, 1],
          message: 'round report',
          fix: context.markdown === 'A'
            ? fixer => fixer.replaceTextRange([0, 1], 'B')
            : undefined
        })
      })
    };

    const result = lintMarkdownInternal('A', [{ rule }], true);

    expect(result.fixedResult?.rounds).toBe(2);
    expect(result.lintResult.reports[0]).toMatchObject({
      content: 'A',
      loc: {
        start: { offset: 0 },
        end: { offset: 1 }
      }
    });
    expect(result.remainingLintResult?.reports[0].content).toBe('');
    expect(result.remainingLintResult?.reports[0].loc).toEqual({
      start: { line: 1, column: 1, offset: 0 },
      end: { line: 1, column: 2, offset: 1 }
    });
    expect(result.remainingLintResult?.reports[0].range).toEqual({
      start: { line: 1, column: 1, offset: 0 },
      end: { line: 1, column: 2, offset: 1 }
    });
  });

  test('separates execution data from public result models', () => {
    const markdown = '中文English';
    let fixCalled = false;
    const legacyLoc = {
      start: { line: 99, column: 99, offset: 0 },
      end: { line: 99, column: 100, offset: 1 }
    };
    const rule: LintMdRule = {
      meta: { name: 'boundary-report' },
      create: context => ({
        root: () => context.report({
          loc: legacyLoc,
          message: 'boundary report',
          fix: () => {
            fixCalled = true;
            return { range: [0, 1], text: '替' };
          }
        })
      })
    };
    const rules = [{ rule, severity: RULE_SEVERITY.WARN }];

    const execution = runLint(markdown, rules, { computeFixes: false });

    expect(execution.reports[0].fix).toBeInstanceOf(Function);
    expect(execution).not.toHaveProperty('diagnostics');
    expect(fixCalled).toBe(false);

    const result = lintMarkdown(markdown, {
      rules: {
        'space-around-alphabet': RULE_SEVERITY.OFF,
        'boundary-report': [rule, RULE_SEVERITY.WARN, {}]
      }
    });

    expect(result.diagnostics).toStrictEqual([{
      line: 1,
      column: 1,
      range: {
        start: { line: 1, column: 1, offset: 0 },
        end: { line: 1, column: 2, offset: 1 }
      },
      ruleId: 'boundary-report',
      message: 'boundary report',
      severity: RULE_SEVERITY.WARN,
      fixable: true
    }]);
    expect(result.lintResult).toStrictEqual([{
      loc: legacyLoc,
      message: 'boundary report',
      name: 'boundary-report',
      content: markdown.slice(0, 6),
      severity: RULE_SEVERITY.WARN
    }]);
    expect(result.diagnostics[0]).not.toHaveProperty('legacyLoc');
    expect(result.diagnostics[0]).not.toHaveProperty('legacyContent');
    expect(fixCalled).toBe(false);
  });
});
