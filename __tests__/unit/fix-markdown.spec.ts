import {
  RULE_SEVERITY,
  RuleExecutionFailure,
  fixMarkdown,
  lintMarkdown
} from '../../src';
import type { LintMdFixResult, LintMdRule } from '../../src';

describe('fixMarkdown', () => {
  test('applies configured fixes and returns diagnostics for the original input', () => {
    const result: LintMdFixResult = fixMarkdown('第一段\n\n\n第二段', {
      rules: {
        'no-multiple-blank-lines': RULE_SEVERITY.ERROR
      }
    });

    expect(result.fixedResult.result).toBe('第一段\n\n第二段');
    expect(result.lintResult).toHaveLength(1);
    expect(result.lintResult[0].name).toBe('no-multiple-blank-lines');
  });

  test('forwards the strict rule error policy', () => {
    const throwingRule: LintMdRule = {
      meta: { name: 'throwing-rule' },
      create: () => ({
        text: () => {
          throw new Error('strict failure');
        }
      })
    };

    expect(() => fixMarkdown('text', {
      rules: {
        'throwing-rule': [
          throwingRule,
          RULE_SEVERITY.ERROR,
          {}
        ]
      },
      ruleErrorPolicy: 'strict'
    })).toThrow(RuleExecutionFailure);
  });

  test('matches the legacy fix behavior', () => {
    const markdown = '第一段\n\n\n第二段';
    const rules = {
      'no-multiple-blank-lines': RULE_SEVERITY.ERROR
    };
    const current = fixMarkdown(markdown, { rules });
    const legacy = lintMarkdown(markdown, rules, true);
    const { metrics: currentMetrics, ...currentFixedResult }
      = current.fixedResult;
    const { metrics: legacyMetrics, ...legacyFixedResult }
      = legacy.fixedResult;

    expect(current.lintResult).toStrictEqual(legacy.lintResult);
    expect(current.diagnostics).toStrictEqual(legacy.diagnostics);
    expect(currentFixedResult).toStrictEqual(legacyFixedResult);
    expect(current.fixableErrorCount).toBe(legacy.fixableErrorCount);
    expect(current.fixableWarningCount).toBe(legacy.fixableWarningCount);
    expect(current.executionErrors).toStrictEqual(legacy.executionErrors);
    expect(currentMetrics?.rounds).toBe(legacyMetrics?.rounds);
  });
});
