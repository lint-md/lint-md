import {
  RULE_SEVERITY,
  RuleExecutionFailure,
  fixMarkdown,
  lintMarkdown
} from '../../src';
import type {
  FixMarkdownResult,
  LintMarkdownResult,
  LintMdFixResult,
  LintMdLintResult,
  LintMdRule,
  LintMdRulesConfig
} from '../../src';

const blankLineRules = {
  'no-multiple-blank-lines': RULE_SEVERITY.ERROR
};

describe('lintMarkdown options API', () => {
  test('runs lint-only with rules from options', () => {
    const result: LintMarkdownResult = lintMarkdown('first\n\n\nsecond', {
      rules: blankLineRules
    });

    expect(result.fixedResult).toBeNull();
    expect(result.complete).toBe(true);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].ruleId).toBe('no-multiple-blank-lines');
  });

  test('rejects invalid severity before lint and fix return a result', () => {
    const rules = { 'no-multiple-blank-lines': 3 };

    expect(() => lintMarkdown('first\n\n\nsecond', { rules }))
      .toThrow(/规则 no-multiple-blank-lines 的级别必须为 0、1 或 2/);
    expect(() => fixMarkdown('first\n\n\nsecond', { rules }))
      .toThrow(/规则 no-multiple-blank-lines 的级别必须为 0、1 或 2/);
  });

  test('marks collected selector errors as incomplete', () => {
    const throwingRule: LintMdRule = {
      meta: { name: 'throwing-rule' },
      create: () => ({
        text: () => {
          throw new Error('selector failure');
        }
      })
    };

    const result = lintMarkdown('text', {
      rules: {
        'throwing-rule': [throwingRule, RULE_SEVERITY.ERROR, {}]
      },
      ruleErrorPolicy: 'collect'
    });

    expect(result.executionErrors).toHaveLength(1);
    expect(result.complete).toBe(false);
  });

  test('keeps legacy fix mode when the second argument is omitted', () => {
    const markdown = 'first\n\n\nsecond';
    const result: LintMdFixResult = lintMarkdown(markdown);

    expect(result.fixedResult.result).toBe(markdown);
  });

  test('keeps distinct behavior for two-argument calls with empty rules', () => {
    const markdown = 'first\n\n\nsecond';
    const legacyResult: LintMdFixResult = lintMarkdown(markdown, {});
    const optionsResult: LintMarkdownResult = lintMarkdown(markdown, { rules: {} });

    expect(legacyResult.fixedResult.result).toBe(markdown);
    expect(optionsResult.fixedResult).toBeNull();
    expect(optionsResult.complete).toBe(true);
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

    expect(() => lintMarkdown('text', {
      rules: {
        'throwing-rule': [throwingRule, RULE_SEVERITY.ERROR, {}]
      },
      ruleErrorPolicy: 'strict'
    })).toThrow(RuleExecutionFailure);
  });

  test('keeps explicit legacy lint and fix modes', () => {
    const markdown = 'first\n\n\nsecond';
    const defaultFixResult: LintMdFixResult = lintMarkdown(markdown, blankLineRules);
    const lintResult: LintMdLintResult = lintMarkdown(markdown, blankLineRules, false);
    const fixResult: LintMdFixResult = lintMarkdown(markdown, blankLineRules, true);
    const optionsFixResult: FixMarkdownResult = fixMarkdown(markdown, {
      rules: blankLineRules
    });

    expect(defaultFixResult.fixedResult.result).toBe('first\n\nsecond');
    expect(lintResult.fixedResult).toBeNull();
    expect(fixResult.fixedResult.result).toBe('first\n\nsecond');
    expect(optionsFixResult.fixedResult.result).toBe('first\n\nsecond');
  });

  test.each(['rules', 'ruleErrorPolicy'])('keeps a legacy rule named %s', (ruleName) => {
    const legacyRule: LintMdRule = {
      meta: { name: ruleName },
      create: context => ({
        text: (node) => {
          context.report({
            loc: node.position,
            message: 'replace text',
            fix: fixer => fixer.replaceTextRange([
              node.position.start.offset,
              node.position.end.offset
            ], 'fixed')
          });
        }
      })
    };

    const rules: LintMdRulesConfig = {
      [ruleName]: [legacyRule, RULE_SEVERITY.ERROR, {}]
    };
    const result: LintMdFixResult = lintMarkdown('text', rules);

    expect(result.fixedResult.result).toBe('fixed');
  });
});
