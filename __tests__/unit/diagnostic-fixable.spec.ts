import { lintMarkdown } from '../../src';
import type { LintDiagnostic, LintMdRule, LintMdRulesConfig } from '../../src/types';
import { RULE_SEVERITY } from '../../src/types';

const FIX_RANGE: [number, number] = [0, 1];

const fixableMarkerRule: LintMdRule = {
  meta: { name: 'fixable-marker' },
  create: context => ({
    root: () => context.report({
      range: FIX_RANGE,
      message: 'fixable finding',
      fix: () => ({ range: FIX_RANGE, text: 'X' })
    })
  })
};

const plainMarkerRule: LintMdRule = {
  meta: { name: 'plain-marker' },
  create: context => ({
    root: () => context.report({
      range: FIX_RANGE,
      message: 'finding without fix'
    })
  })
};

describe('LintDiagnostic.fixable (#190)', () => {
  test('report with fix callback exposes fixable === true', () => {
    const result = lintMarkdown(
      '中文English',
      { 'space-around-alphabet': 0, 'fixableMarker': [fixableMarkerRule, 2, {}] },
      false
    );

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].ruleId).toBe('fixable-marker');
    expect(result.diagnostics[0].fixable).toBe(true);
  });

  test('report without fix callback exposes fixable === false', () => {
    const result = lintMarkdown(
      '中文English',
      { 'space-around-alphabet': 0, 'plainMarker': [plainMarkerRule, 2, {}] },
      false
    );

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].fixable).toBe(false);
  });

  test('fixability holds for both ERROR and WARN severities', () => {
    const markdown = '中文English';
    const config = (severity: number): LintMdRulesConfig => ({
      'space-around-alphabet': 0,
      'fixableMarker': [fixableMarkerRule, severity, {}]
    });
    const errorResult = lintMarkdown(markdown, config(2), false);
    const warnResult = lintMarkdown(markdown, config(1), false);

    expect(errorResult.diagnostics[0].severity).toBe(RULE_SEVERITY.ERROR);
    expect(errorResult.diagnostics[0].fixable).toBe(true);
    expect(warnResult.diagnostics[0].severity).toBe(RULE_SEVERITY.WARN);
    expect(warnResult.diagnostics[0].fixable).toBe(true);

    // 顶层 counts 仍按各自独立逻辑统计，本 PR 不改变其行为。
    expect(errorResult.fixableErrorCount).toBe(1);
    expect(warnResult.fixableWarningCount).toBe(1);
  });

  test('lint-only mode reports fixable without executing the fix callback', () => {
    let fixCalled = false;
    const neverRunRule: LintMdRule = {
      meta: { name: 'never-run-fix' },
      create: context => ({
        root: () => context.report({
          range: FIX_RANGE,
          message: 'must not run in lint-only mode',
          fix: () => {
            fixCalled = true;
            throw new Error('should not execute');
          }
        })
      })
    };

    const result = lintMarkdown(
      '中文English',
      { 'space-around-alphabet': 0, 'neverRunFix': [neverRunRule, 2, {}] },
      false
    );

    expect(result.diagnostics[0].fixable).toBe(true);
    expect(fixCalled).toBe(false);
    expect(result.executionErrors).toHaveLength(0);
  });

  test('every core diagnostic carries a boolean fixable field', () => {
    const markdown = ['中文English 混排', '', '第二段有123数字和English结尾。'].join('\n');
    const result = lintMarkdown(markdown, {}, false);

    expect(result.diagnostics.length).toBeGreaterThan(0);
    for (const diagnostic of result.diagnostics) {
      expect(typeof diagnostic.fixable).toBe('boolean');
    }
  });

  test('legacy literal without fixable still satisfies LintDiagnostic (2.x construction compat)', () => {
    const legacy: LintDiagnostic[] = [
      { line: 1, column: 2, ruleId: 'some-rule', message: 'legacy literal', severity: RULE_SEVERITY.WARN },
      {
        line: 1,
        column: 3,
        range: { start: { line: 1, column: 3, offset: 2 }, end: { line: 1, column: 5, offset: 4 } },
        ruleId: 'some-rule',
        message: 'legacy literal with range',
        severity: RULE_SEVERITY.ERROR
      }
    ];

    expect(legacy).toHaveLength(2);
  });
});
