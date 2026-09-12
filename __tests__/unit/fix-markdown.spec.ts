import {
  FixConvergence,
  RULE_SEVERITY,
  RuleExecutionFailure,
  fixMarkdown,
  lintMarkdown
} from '../../src';
import type { FixMarkdownResult, LintMdRule } from '../../src';
import { MAX_LINT_AND_FIX_CALL_TIMES } from '../../src/common/constant';

describe('fixMarkdown', () => {
  test('applies configured fixes and returns diagnostics for the original input', () => {
    const result: FixMarkdownResult = fixMarkdown('第一段\n\n\n第二段', {
      rules: {
        'no-multiple-blank-lines': RULE_SEVERITY.ERROR
      }
    });

    expect(result.fixedResult.result).toBe('第一段\n\n第二段');
    expect(result.lintResult).toHaveLength(1);
    expect(result.lintResult[0].name).toBe('no-multiple-blank-lines');
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].ruleId).toBe('no-multiple-blank-lines');
    expect(result.initialDiagnostics).toBe(result.diagnostics);
    expect(result.remainingDiagnostics).toHaveLength(0);
    expect(result.initialSummary).toBe(result.summary);
    expect(result.remainingSummary.errorCount).toBe(0);
    expect(result.fixableErrorCount).toBe(1);
    expect(result.complete).toBe(true);
  });

  test('reuses diagnostics when stable output needs no fixes', () => {
    const reportOnlyRule: LintMdRule = {
      meta: { name: 'report-only' },
      create: context => ({
        text: node => context.report({
          loc: node.position,
          message: 'report text'
        })
      })
    };

    const result = fixMarkdown('plain', {
      rules: {
        'report-only': [reportOnlyRule, RULE_SEVERITY.ERROR, {}]
      }
    });

    expect(result.fixedResult.convergence).toBe(FixConvergence.STABLE);
    expect(result.initialDiagnostics).toBe(result.remainingDiagnostics);
    expect(result.initialSummary).toBe(result.remainingSummary);
    expect(result.remainingDiagnostics[0].range).toMatchObject({
      start: { offset: 0 },
      end: { offset: result.fixedResult.result.length }
    });
  });

  test('verifies diagnostics against cycle output', () => {
    const cycleRule: LintMdRule = {
      meta: { name: 'cycle' },
      create: context => ({
        text: (node) => {
          if (node.type !== 'text') {
            return;
          }
          const replacement = node.value === 'A' ? 'BB' : 'A';
          context.report({
            loc: node.position,
            message: `replace ${node.value}`,
            fix: fixer => fixer.replaceTextRange([
              node.position.start.offset,
              node.position.end.offset
            ], replacement)
          });
        }
      })
    };

    const result = fixMarkdown('A', {
      rules: { cycle: [cycleRule, RULE_SEVERITY.ERROR, {}] }
    });

    expect(result.fixedResult.convergence).toBe(FixConvergence.CYCLE_DETECTED);
    expect(result.fixedResult.result).toBe('A');
    expect(result.initialDiagnostics[0].message).toBe('replace A');
    expect(result.remainingDiagnostics[0].message).toBe('replace A');
    expect(result.remainingDiagnostics[0].range?.end.offset).toBe(1);
  });

  test('verifies diagnostics against max-round output', () => {
    const appendRule: LintMdRule = {
      meta: { name: 'append' },
      create: context => ({
        text: (node) => {
          if (node.type !== 'text') {
            return;
          }
          context.report({
            loc: node.position,
            message: `length ${node.value.length}`,
            fix: fixer => fixer.replaceTextRange([
              node.position.start.offset,
              node.position.end.offset
            ], `${node.value}a`)
          });
        }
      })
    };

    const result = fixMarkdown('A', {
      rules: { append: [appendRule, RULE_SEVERITY.ERROR, {}] }
    });

    expect(result.fixedResult.convergence).toBe(FixConvergence.MAX_ROUNDS);
    expect(result.initialDiagnostics[0].range?.end.offset).toBe(1);
    expect(result.remainingDiagnostics[0].message)
      .toBe(`length ${result.fixedResult.result.length}`);
    expect(result.remainingDiagnostics[0].range?.end.offset)
      .toBe(result.fixedResult.result.length);
  });

  test('removes obsolete conflicts after another fix resolves the lint finding', () => {
    const result = fixMarkdown('### 问题:\n');

    expect(result.fixedResult.result).toBe('### 问题\n');
    expect(result.fixedResult.notAppliedFixes).toEqual([]);
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

  test('returns fix callback errors in collect mode', () => {
    const throwingFixRule: LintMdRule = {
      meta: { name: 'throwing-fix-rule' },
      create: context => ({
        text: (node) => {
          context.report({
            loc: node.position,
            message: 'needs fix',
            fix: () => {
              throw new Error('fix failure');
            }
          });
        }
      })
    };

    const result = fixMarkdown('text', {
      rules: {
        'throwing-fix-rule': [
          throwingFixRule,
          RULE_SEVERITY.ERROR,
          {}
        ]
      }
    });

    expect(result.executionErrors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        ruleName: 'throwing-fix-rule',
        phase: 'fix',
        round: 0
      })
    ]));
    expect(result.fixedResult.result).toBe('text');
    expect(result.complete).toBe(false);
  });

  test('marks a fix result incomplete after an intermediate round error', () => {
    const rule: LintMdRule = {
      meta: { name: 'intermediate-error' },
      create: context => ({
        text: (node) => {
          if (node.type !== 'text' || node.value === 'C') {
            return;
          }
          context.report({
            loc: node.position,
            message: 'advance text',
            fix: fixer => fixer.replaceTextRange([
              node.position.start.offset,
              node.position.end.offset
            ], node.value === 'A' ? 'B' : 'C')
          });
          if (node.value === 'B') {
            throw new Error('intermediate failure');
          }
        }
      })
    };

    const result = fixMarkdown('A', {
      rules: { 'intermediate-error': [rule, RULE_SEVERITY.ERROR, {}] }
    });

    expect(result.fixedResult.result).toBe('C');
    expect(result.executionErrors).toEqual([
      expect.objectContaining({ round: 1, phase: 'selector' })
    ]);
    expect(result.complete).toBe(false);
  });

  test('includes final verification errors in completeness', () => {
    let createCalls = 0;
    const rule: LintMdRule = {
      meta: { name: 'final-verification-error' },
      create: (context) => {
        createCalls++;
        return {
          text: (node) => {
            if (node.type !== 'text') {
              return;
            }
            if (createCalls > MAX_LINT_AND_FIX_CALL_TIMES) {
              throw new Error('final verification failure');
            }
            context.report({
              loc: node.position,
              message: 'append text',
              fix: fixer => fixer.insertTextAt(node.position.end.offset, 'a')
            });
          }
        };
      }
    };

    const result = fixMarkdown('A', {
      rules: { 'final-verification-error': [rule, RULE_SEVERITY.ERROR, {}] }
    });

    expect(result.fixedResult.convergence).toBe(FixConvergence.MAX_ROUNDS);
    expect(result.executionErrors).toEqual([
      expect.objectContaining({
        round: MAX_LINT_AND_FIX_CALL_TIMES,
        phase: 'selector'
      })
    ]);
    expect(result.complete).toBe(false);
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
