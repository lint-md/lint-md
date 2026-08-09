import { normalizeRuleRegistry } from '../../../src/utils/normalize-rule-registry';
import { type LintMdRule, RULE_SEVERITY } from '../../../src/types';

const createMockRule = (name: string): LintMdRule => ({
  meta: { name },
  create: () => ({})
});

describe('normalizeRuleRegistry', () => {
  const defaultRules: Record<string, LintMdRule> = {
    'rule-a': createMockRule('rule-a'),
    'rule-b': createMockRule('rule-b')
  };

  it('should register all default rules with ERROR severity and empty options', () => {
    const result = normalizeRuleRegistry(defaultRules, {});
    expect(result.get('rule-a')).toEqual({
      id: 'rule-a',
      configKey: 'rule-a',
      rule: defaultRules['rule-a'],
      options: {},
      severity: RULE_SEVERITY.ERROR
    });
    expect(result.get('rule-b')).toEqual({
      id: 'rule-b',
      configKey: 'rule-b',
      rule: defaultRules['rule-b'],
      options: {},
      severity: RULE_SEVERITY.ERROR
    });
  });

  it('should override severity with number config', () => {
    const result = normalizeRuleRegistry(defaultRules, {
      'rule-a': RULE_SEVERITY.WARN
    });
    expect(result.get('rule-a')?.severity).toBe(RULE_SEVERITY.WARN);
    expect(result.get('rule-a')?.options).toEqual({});
  });

  it('should use configured default severities', () => {
    const result = normalizeRuleRegistry(
      defaultRules,
      {},
      { 'rule-b': RULE_SEVERITY.OFF }
    );

    expect(result.get('rule-a')?.severity).toBe(RULE_SEVERITY.ERROR);
    expect(result.get('rule-b')?.severity).toBe(RULE_SEVERITY.OFF);
  });

  it('should let user config override a configured default severity', () => {
    const result = normalizeRuleRegistry(
      defaultRules,
      { 'rule-b': RULE_SEVERITY.WARN },
      { 'rule-b': RULE_SEVERITY.OFF }
    );

    expect(result.get('rule-b')?.severity).toBe(RULE_SEVERITY.WARN);
  });

  it('should override severity and options with tuple config', () => {
    const result = normalizeRuleRegistry(defaultRules, {
      'rule-a': [RULE_SEVERITY.OFF, { foo: 'bar' }]
    });
    expect(result.get('rule-a')?.severity).toBe(RULE_SEVERITY.OFF);
    expect(result.get('rule-a')?.options).toEqual({ foo: 'bar' });
  });

  it('should throw error for invalid tuple config (length !== 2)', () => {
    expect(() => {
      normalizeRuleRegistry(defaultRules, {
        'rule-a': [RULE_SEVERITY.ERROR] as any
      });
    }).toThrow(/无效的规则配置/);
  });

  it('should register third-party rule with tuple config (length === 3)', () => {
    const customRule = createMockRule('custom-rule');
    const result = normalizeRuleRegistry(defaultRules, {
      'custom-rule': [customRule, RULE_SEVERITY.WARN, { custom: true }]
    });
    expect(result.get('custom-rule')).toEqual({
      id: 'custom-rule',
      configKey: 'custom-rule',
      rule: customRule,
      severity: RULE_SEVERITY.WARN,
      options: { custom: true }
    });
  });

  it('should throw error for invalid third-party rule config (length !== 3)', () => {
    const customRule = createMockRule('custom-rule');
    expect(() => {
      normalizeRuleRegistry(defaultRules, {
        'custom-rule': [customRule, RULE_SEVERITY.WARN] as any
      });
    }).toThrow(/第三方规则.*配置长度必须为 3/);
  });

  it('should throw for unknown rule when config is not an array (issue #177)', () => {
    expect(() => {
      normalizeRuleRegistry(defaultRules, {
        'custom-rule': RULE_SEVERITY.WARN as any
      });
    }).toThrow(/配置格式非法/);
  });

  it('should store an aliased third-party rule only by meta.name', () => {
    const customRule = createMockRule('actual-name');
    const result = normalizeRuleRegistry(defaultRules, {
      'configured-alias': [customRule, RULE_SEVERITY.WARN, {}]
    });
    expect(result.has('configured-alias')).toBe(false);
    expect(result.get('actual-name')).toMatchObject({
      id: 'actual-name',
      configKey: 'configured-alias',
      rule: customRule
    });
  });

  it('should handle empty default rules', () => {
    const result = normalizeRuleRegistry({}, {});
    expect(result.size).toBe(0);
  });

  it('should handle config with disabled rules', () => {
    const result = normalizeRuleRegistry(defaultRules, {
      'rule-a': RULE_SEVERITY.OFF,
      'rule-b': RULE_SEVERITY.OFF
    });
    expect(result.get('rule-a')?.severity).toBe(RULE_SEVERITY.OFF);
    expect(result.get('rule-b')?.severity).toBe(RULE_SEVERITY.OFF);
  });
  it('should throw for prototype-like unknown rule name and not pollute Object.prototype (issue #177)', () => {
    const rules = JSON.parse('{"__proto__": 2}') as any;

    expect(() => normalizeRuleRegistry(defaultRules, rules)).toThrow(/未知规则/);
    expect(Object.hasOwn(Object.prototype, 'severity')).toBe(false);
  });

  it('should store a prototype-like rule ID without pollution', () => {
    const protoRule = createMockRule('__proto__');
    const result = normalizeRuleRegistry(defaultRules, {
      'proto-alias': [protoRule, RULE_SEVERITY.WARN, {}]
    });

    expect(Object.hasOwn(Object.prototype, 'severity')).toBe(false);
    const protoEntry = result.get('__proto__');
    expect(protoEntry).toBeDefined();
    expect(protoEntry?.rule).toBe(protoRule);
  });
});
