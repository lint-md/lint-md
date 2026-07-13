import { lintMarkdown } from '../../src';
import * as internalRules from '../../src/rules';
import type { LintMdRule, LintMdRulesConfig, PositionedTextNode } from '../../src/types';
import { RULE_SEVERITY } from '../../src/types';

const makeMockRule = (opts: {
  name: string;
  withFix?: boolean;
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

describe('lintMarkdown() rule alias & config contract (issue #177)', () => {
  test('1. alias config key (key !== meta.name) does not crash and reports correctly', () => {
    const mockRule = makeMockRule({ name: 'actual-rule-name', withFix: false });
    const res = lintMarkdown('text only', {
      ...disableAllInternal(),
      'configured-alias': [mockRule, RULE_SEVERITY.ERROR, {}]
    }, false);

    expect(res.lintResult).toHaveLength(1);
    expect(res.lintResult?.[0]?.name).toBe('actual-rule-name');
    expect(res.lintResult?.[0]?.severity).toBe(RULE_SEVERITY.ERROR);
  });

  test('2. same-name rule (config key === meta.name) still works', () => {
    const mockRule = makeMockRule({ name: 'same-name-rule', withFix: false });
    const res = lintMarkdown('text only', {
      ...disableAllInternal(),
      'same-name-rule': [mockRule, RULE_SEVERITY.WARN, {}]
    }, false);

    expect(res.lintResult).toHaveLength(1);
    expect(res.lintResult?.[0]?.name).toBe('same-name-rule');
    expect(res.lintResult?.[0]?.severity).toBe(RULE_SEVERITY.WARN);
  });

  test('3. alias does not double-run the rule (report count stays correct)', () => {
    const mockRule = makeMockRule({ name: 'no-double-run', withFix: false, matchesText: 'alpha' });
    const res = lintMarkdown('alpha', {
      ...disableAllInternal(),
      'alias-key': [mockRule, RULE_SEVERITY.ERROR, {}]
    }, false);

    // 配置键 + meta.name 别名指向同一记录，应只运行一次，不翻倍。
    expect(res.lintResult).toHaveLength(1);
  });

  test('4. alias conflict (two configs mapping to same meta.name) throws', () => {
    const ruleA = makeMockRule({ name: 'shared-meta-name', withFix: false });
    const ruleB = makeMockRule({ name: 'shared-meta-name', withFix: false });

    expect(() => lintMarkdown('text only', {
      ...disableAllInternal(),
      'key-a': [ruleA, RULE_SEVERITY.ERROR, {}],
      'key-b': [ruleB, RULE_SEVERITY.ERROR, {}]
    }, false)).toThrow(/别名冲突/);
  });

  test('5. unknown rule with illegal (non-array) config throws instead of silent ignore', () => {
    expect(() => lintMarkdown('text only', {
      ...disableAllInternal(),
      // 拼写错误的规则名配了一个数字 -> 此前被静默忽略
      'space-around-alphbet': RULE_SEVERITY.ERROR as unknown as LintMdRulesConfig[string]
    }, false)).toThrow(/配置格式非法/);
  });

  test('6. third-party rule with illegal array length (not 3) throws', () => {
    const mockRule = makeMockRule({ name: 'illegal-length', withFix: false });
    expect(() => lintMarkdown('text only', {
      ...disableAllInternal(),
      'illegal-length': [mockRule, RULE_SEVERITY.ERROR] as unknown as LintMdRulesConfig[string]
    }, false)).toThrow(/配置长度必须为 3/);
  });

  test('7. disabled (OFF) third-party rule produces no report', () => {
    const mockRule = makeMockRule({ name: 'off-third-party', withFix: false, matchesText: 'alpha' });
    const res = lintMarkdown('alpha', {
      ...disableAllInternal(),
      'off-third-party': [mockRule, RULE_SEVERITY.OFF, {}]
    }, false);

    expect(res.lintResult).toHaveLength(0);
    expect(res.fixableErrorCount).toBe(0);
    expect(res.fixableWarningCount).toBe(0);
  });

  test('8. error / warn counts correct for aliased third-party rules', () => {
    const errRule = makeMockRule({ name: 'alias-error', withFix: true, matchesText: 'alpha' });
    const warnRule = makeMockRule({ name: 'alias-warn', withFix: true, matchesText: 'beta' });

    const res = lintMarkdown('alpha\n\nbeta', {
      ...disableAllInternal(),
      'err-alias': [errRule, RULE_SEVERITY.ERROR, {}],
      'warn-alias': [warnRule, RULE_SEVERITY.WARN, {}]
    }, false);

    expect(res.lintResult).toHaveLength(2);
    expect(res.fixableErrorCount).toBe(1);
    expect(res.fixableWarningCount).toBe(1);
  });

  test('9. third-party rule cannot silently override a built-in rule by meta.name (P1)', () => {
    // 复用内置规则名 space-around-alphabet，但实现为空，企图替换内置规则。
    const hijackRule = makeMockRule({ name: 'space-around-alphabet', withFix: false });
    expect(() => lintMarkdown('hello world', {
      'hijack-alias': [hijackRule, RULE_SEVERITY.WARN, {}]
    }, false)).toThrow(/别名冲突/);
  });

  test('10. same rule object reused under two config keys is a conflict (P1)', () => {
    const sharedRule = makeMockRule({ name: 'shared-name', withFix: false });
    expect(() => lintMarkdown('text only', {
      ...disableAllInternal(),
      'alias-a': [sharedRule, RULE_SEVERITY.ERROR, { source: 'a' }],
      'alias-b': [sharedRule, RULE_SEVERITY.WARN, { source: 'b' }]
    }, false)).toThrow(/别名冲突/);
  });
});
