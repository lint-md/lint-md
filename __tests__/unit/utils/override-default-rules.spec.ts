import { overrideDefaultRules } from '../../../src/utils/override-default-rules';
import { RULE_SEVERITY, type LintMdRule } from '../../../src/types';

const createMockRule = (name: string): LintMdRule => ({
  meta: { name },
  create: () => ({})
});

describe('overrideDefaultRules', () => {
  const defaultRules: Record<string, LintMdRule> = {
    'rule-a': createMockRule('rule-a'),
    'rule-b': createMockRule('rule-b')
  };

  it('should register all default rules with ERROR severity and empty options', () => {
    const result = overrideDefaultRules(defaultRules, {});
    expect(result['rule-a']).toEqual({
      rule: defaultRules['rule-a'],
      options: {},
      severity: RULE_SEVERITY.ERROR
    });
    expect(result['rule-b']).toEqual({
      rule: defaultRules['rule-b'],
      options: {},
      severity: RULE_SEVERITY.ERROR
    });
  });

  it('should override severity with number config', () => {
    const result = overrideDefaultRules(defaultRules, {
      'rule-a': RULE_SEVERITY.WARN
    });
    expect(result['rule-a'].severity).toBe(RULE_SEVERITY.WARN);
    expect(result['rule-a'].options).toEqual({});
  });

  it('should override severity and options with tuple config', () => {
    const result = overrideDefaultRules(defaultRules, {
      'rule-a': [RULE_SEVERITY.OFF, { foo: 'bar' }]
    });
    expect(result['rule-a'].severity).toBe(RULE_SEVERITY.OFF);
    expect(result['rule-a'].options).toEqual({ foo: 'bar' });
  });

  it('should throw error for invalid tuple config (length !== 2)', () => {
    expect(() => {
      overrideDefaultRules(defaultRules, {
        'rule-a': [RULE_SEVERITY.ERROR] as any
      });
    }).toThrow(/无效的规则配置/);
  });

  it('should register third-party rule with tuple config (length === 3)', () => {
    const customRule = createMockRule('custom-rule');
    const result = overrideDefaultRules(defaultRules, {
      'custom-rule': [customRule, RULE_SEVERITY.WARN, { custom: true }]
    });
    expect(result['custom-rule']).toEqual({
      rule: customRule,
      severity: RULE_SEVERITY.WARN,
      options: { custom: true }
    });
  });

  it('should throw error for invalid third-party rule config (length !== 3)', () => {
    const customRule = createMockRule('custom-rule');
    expect(() => {
      overrideDefaultRules(defaultRules, {
        'custom-rule': [customRule, RULE_SEVERITY.WARN] as any
      });
    }).toThrow(/第三方规则.*配置长度必须为 3/);
  });

  it('should throw for unknown rule when config is not an array (issue #177)', () => {
    expect(() => {
      overrideDefaultRules(defaultRules, {
        'custom-rule': RULE_SEVERITY.WARN as any
      });
    }).toThrow(/配置格式非法/);
  });

  it('should register third-party rule alias by meta.name (issue #177)', () => {
    const customRule = createMockRule('actual-name');
    const result = overrideDefaultRules(defaultRules, {
      'configured-alias': [customRule, RULE_SEVERITY.WARN, {}]
    });
    // 配置键与 meta.name 不等时，按 meta.name 建立别名，回查仍能命中同一记录。
    expect(result['configured-alias']).toBeDefined();
    expect(result['actual-name']).toBe(result['configured-alias']);
  });

  it('should handle empty default rules', () => {
    const result = overrideDefaultRules({}, {});
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('should handle config with disabled rules', () => {
    const result = overrideDefaultRules(defaultRules, {
      'rule-a': RULE_SEVERITY.OFF,
      'rule-b': RULE_SEVERITY.OFF
    });
    expect(result['rule-a'].severity).toBe(RULE_SEVERITY.OFF);
    expect(result['rule-b'].severity).toBe(RULE_SEVERITY.OFF);
  });
  it('should throw for prototype-like unknown rule name and not pollute Object.prototype (issue #177)', () => {
    const rules = JSON.parse('{"__proto__": 2}') as any;

    expect(() => overrideDefaultRules(defaultRules, rules)).toThrow(/未知规则/);
    expect(Object.prototype.hasOwnProperty.call(Object.prototype, 'severity')).toBe(false);
  });

  it('should store third-party rule whose meta.name is a prototype key as plain key without pollution (issue #177)', () => {
    // 使用无原型注册表后，meta.name 为 __proto__ 的规则会被当作普通 own 属性保存，
    // 不会改变 Object.prototype，也不会崩溃。
    const protoRule = createMockRule('__proto__');
    const result = overrideDefaultRules(defaultRules, {
      'proto-alias': [protoRule, RULE_SEVERITY.WARN, {}]
    });

    expect(Object.prototype.hasOwnProperty.call(Object.prototype, 'severity')).toBe(false);
    expect((result as any)['__proto__']).toBeDefined();
    expect((result as any)['__proto__'].rule).toBe(protoRule);
  });
});


