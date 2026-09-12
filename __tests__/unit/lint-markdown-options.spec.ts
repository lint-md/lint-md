import {
  RULE_SEVERITY,
  RuleExecutionFailure,
  lintMarkdown
} from '../../src';
import type {
  LintMdFixResult,
  LintMdRule,
  LintMdRulesConfig
} from '../../src';

const blankLineRules = {
  'no-multiple-blank-lines': RULE_SEVERITY.ERROR
};

describe('lintMarkdown options API', () => {
  test('runs lint-only with rules from options', () => {
    const result = lintMarkdown('first\n\n\nsecond', {
      rules: blankLineRules
    });

    expect(result.fixedResult).toBeNull();
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].ruleId).toBe('no-multiple-blank-lines');
  });

  test('runs lint-only when options are omitted', () => {
    const result = lintMarkdown('first\n\n\nsecond');

    expect(result.fixedResult).toBeNull();
  });

  test('treats an empty options object as lint-only', () => {
    const result = lintMarkdown('first\n\n\nsecond', {});

    expect(result.fixedResult).toBeNull();
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
    const lintResult = lintMarkdown(markdown, blankLineRules, false);
    const fixResult = lintMarkdown(markdown, blankLineRules, true);

    expect(lintResult.fixedResult).toBeNull();
    expect(fixResult.fixedResult.result).toBe('first\n\nsecond');
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
