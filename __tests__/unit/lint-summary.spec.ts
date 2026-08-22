import { lintMarkdown } from '../../src';
import type { LintDiagnostic, LintMdRule, LintMdRulesConfig } from '../../src/types';
import { RULE_SEVERITY } from '../../src/types';
import { summarizeDiagnostics } from '../../src/utils/lint-summary';

const FIX_RANGE: [number, number] = [0, 1];

/** 每条规则只在 root 上报一次，组合出可精确预测的诊断构成。 */
const makeMarkerRule = (name: string, fixable: boolean): LintMdRule => ({
  meta: { name },
  create: context => ({
    root: () => context.report({
      range: FIX_RANGE,
      message: name,
      ...(fixable ? { fix: () => ({ range: FIX_RANGE, text: 'X' }) } : {})
    })
  })
});

const errorFixable = makeMarkerRule('error-fixable', true);
const errorPlain = makeMarkerRule('error-plain', false);
const warnFixable = makeMarkerRule('warn-fixable', true);
const warnPlain = makeMarkerRule('warn-plain', false);

const MIXED_CONFIG: LintMdRulesConfig = {
  'space-around-alphabet': 0,
  'errorFixable': [errorFixable, RULE_SEVERITY.ERROR, {}],
  'errorPlain': [errorPlain, RULE_SEVERITY.ERROR, {}],
  'warnFixable': [warnFixable, RULE_SEVERITY.WARN, {}],
  'warnPlain': [warnPlain, RULE_SEVERITY.WARN, {}]
};

describe('LintSummary derivation from diagnostics (#190)', () => {
  test('counts ERROR / WARN / fixable buckets exactly', () => {
    const result = lintMarkdown('中文English', MIXED_CONFIG, false);

    expect(result.diagnostics).toHaveLength(4);
    expect(result.summary).toEqual({
      errorCount: 2,
      warningCount: 2,
      fixableErrorCount: 1,
      fixableWarningCount: 1
    });
  });

  test('non-fixable findings never enter fixable counts', () => {
    const result = lintMarkdown(
      '中文English',
      { 'space-around-alphabet': 0, 'errorPlain': [errorPlain, RULE_SEVERITY.ERROR, {}] },
      false
    );

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].fixable).toBe(false);
    expect(result.summary.errorCount).toBe(1);
    expect(result.summary.warningCount).toBe(0);
    expect(result.summary.fixableErrorCount).toBe(0);
    expect(result.summary.fixableWarningCount).toBe(0);
  });

  test('top-level counts are exact projections of summary', () => {
    const result = lintMarkdown('中文English', MIXED_CONFIG, false);

    expect(result.summary.fixableErrorCount).toBe(result.fixableErrorCount);
    expect(result.summary.fixableWarningCount).toBe(result.fixableWarningCount);
  });

  test('summary always equals summarizeDiagnostics(diagnostics)', () => {
    const mixed = lintMarkdown('中文English', MIXED_CONFIG, false);
    const defaults = lintMarkdown(['中文English 混排', '', '第二段有123数字和English结尾。'].join('\n'), {}, false);
    const fixed = lintMarkdown('中文English', {}, false);

    for (const result of [mixed, defaults, fixed]) {
      expect(result.summary).toEqual(summarizeDiagnostics(result.diagnostics));
    }
  });

  test('empty diagnostics produce an all-zero summary', () => {
    const result = lintMarkdown('# Hello World\n\nThis is clean.', {}, false);

    expect(result.diagnostics).toEqual([]);
    expect(result.summary).toEqual({
      errorCount: 0,
      warningCount: 0,
      fixableErrorCount: 0,
      fixableWarningCount: 0
    });
  });

  test('summarizer ignores OFF-severity entries (defensive invariant)', () => {
    const offEntry: LintDiagnostic = {
      line: 1,
      column: 1,
      ruleId: 'off-rule',
      message: 'should be ignored',
      severity: RULE_SEVERITY.OFF
    };

    expect(summarizeDiagnostics([offEntry])).toEqual({
      errorCount: 0,
      warningCount: 0,
      fixableErrorCount: 0,
      fixableWarningCount: 0
    });
  });
});
