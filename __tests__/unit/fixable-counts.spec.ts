import { lintMarkdown } from '../../src';
import * as internalRules from '../../src/rules';
import type { LintMdRule, LintMdRulesConfig, PositionedTextNode } from '../../src/types';
import { RULE_SEVERITY } from '../../src/types';

const makeMockRule = (opts: {
  name: string;
  withFix: boolean;
  matchesText?: string;
}): LintMdRule => ({
  meta: { name: opts.name },
  create: (context) => ({
    text: (node: PositionedTextNode) => {
      if (opts.matchesText !== undefined && node.value !== opts.matchesText) {
        return;
      }
      context.report({
        loc: node.position,
        message: `mock report from ${opts.name}`,
        ...(opts.withFix
          ? {
              fix: (fixer) => fixer.replaceTextRange(
                [node.position.start.offset, node.position.end.offset],
                'X'
              )
            }
          : {})
      });
    }
  })
});

const disableAllInternal = (): LintMdRulesConfig =>
  Object.fromEntries(
    Object.values(internalRules).map((rule) => [rule.meta.name, RULE_SEVERITY.OFF])
  );

describe('lintMarkdown() fixable counts (issue #152)', () => {
  test('1. counts one fixable error', () => {
    const mockRule = makeMockRule({ name: 'mock-fixable-error', withFix: true });
    const res = lintMarkdown('text only', {
      ...disableAllInternal(),
      'mock-fixable-error': [mockRule, RULE_SEVERITY.ERROR, {}]
    }, false);

    expect(res.fixableErrorCount).toBe(1);
    expect(res.fixableWarningCount).toBe(0);
  });

  test('2. counts one fixable warning', () => {
    const mockRule = makeMockRule({ name: 'mock-fixable-warning', withFix: true });
    const res = lintMarkdown('text only', {
      ...disableAllInternal(),
      'mock-fixable-warning': [mockRule, RULE_SEVERITY.WARN, {}]
    }, false);

    expect(res.fixableErrorCount).toBe(0);
    expect(res.fixableWarningCount).toBe(1);
  });

  test('3. non-fixable report does not increment counts', () => {
    const mockRule = makeMockRule({ name: 'mock-no-fix', withFix: false });
    const res = lintMarkdown('text only', {
      ...disableAllInternal(),
      'mock-no-fix': [mockRule, RULE_SEVERITY.ERROR, {}]
    }, false);

    expect(res.fixableErrorCount).toBe(0);
    expect(res.fixableWarningCount).toBe(0);
  });

  test('4. counts mix of fixable / non-fixable and error / warning', () => {
    const fixableError = makeMockRule({ name: 'mix-fixable-error', withFix: true, matchesText: 'alpha' });
    const fixableWarning = makeMockRule({ name: 'mix-fixable-warning', withFix: true, matchesText: 'beta' });
    const nonFixableError = makeMockRule({ name: 'mix-non-fixable-error', withFix: false, matchesText: 'gamma' });
    const nonFixableWarning = makeMockRule({ name: 'mix-non-fixable-warning', withFix: false, matchesText: 'delta' });

    const res = lintMarkdown('alpha\n\nbeta\n\ngamma\n\ndelta', {
      ...disableAllInternal(),
      'mix-fixable-error': [fixableError, RULE_SEVERITY.ERROR, {}],
      'mix-fixable-warning': [fixableWarning, RULE_SEVERITY.WARN, {}],
      'mix-non-fixable-error': [nonFixableError, RULE_SEVERITY.ERROR, {}],
      'mix-non-fixable-warning': [nonFixableWarning, RULE_SEVERITY.WARN, {}]
    }, false);

    expect(res.lintResult).toHaveLength(4);
    expect(res.fixableErrorCount).toBe(1);
    expect(res.fixableWarningCount).toBe(1);
  });

  test('5. no reports yields zero counts', () => {
    const res = lintMarkdown('', disableAllInternal(), false);

    expect(res.lintResult).toHaveLength(0);
    expect(res.fixableErrorCount).toBe(0);
    expect(res.fixableWarningCount).toBe(0);
  });

  test('6. isFixMode=false still computes counts and fixedResult is null', () => {
    const mockRule = makeMockRule({ name: 'lint-only-fixable', withFix: true });
    const res = lintMarkdown('text only', {
      ...disableAllInternal(),
      'lint-only-fixable': [mockRule, RULE_SEVERITY.ERROR, {}]
    }, false);

    expect(res.fixableErrorCount).toBe(1);
    expect(res.fixedResult).toBeNull();
  });

  test('7. isFixMode=true counts reflect pre-fix lintResult', () => {
    const mockRule = makeMockRule({ name: 'fix-mode-fixable', withFix: true });
    const res = lintMarkdown('text only', {
      ...disableAllInternal(),
      'fix-mode-fixable': [mockRule, RULE_SEVERITY.ERROR, {}]
    }, true);

    expect(res.fixableErrorCount).toBe(1);
    expect(res.lintResult).toHaveLength(1);
    expect(res.lintResult?.[0]?.name).toBe('fix-mode-fixable');
  });

  test('8. lintResult items do not expose fix function (worker-boundary safe)', () => {
    const mockRule = makeMockRule({ name: 'no-fix-leak', withFix: true });
    const res = lintMarkdown('text only', {
      ...disableAllInternal(),
      'no-fix-leak': [mockRule, RULE_SEVERITY.ERROR, {}]
    }, false);

    expect(res.lintResult).toHaveLength(1);
    const item = res.lintResult?.[0];
    expect(item).toBeDefined();
    expect(Object.keys(item!)).toEqual(
      expect.arrayContaining(['loc', 'message', 'name', 'content', 'severity'])
    );
    expect((item as Record<string, unknown>).fix).toBeUndefined();
  });
});
