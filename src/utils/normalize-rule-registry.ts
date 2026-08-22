import type { LintMdRule, LintMdRulesConfig } from '../types.js';
import { RULE_SEVERITY } from '../types.js';

export interface NormalizedRuleRecord {
  readonly id: string
  readonly configKey: string
  readonly rule: LintMdRule
  readonly severity: number
  readonly options: Record<string, any>
}

export type NormalizedRuleRegistry = ReadonlyMap<string, NormalizedRuleRecord>;

const getDefaultSeverity = (
  id: string,
  defaultRuleSeverities: Readonly<Partial<Record<string, RULE_SEVERITY>>>
): RULE_SEVERITY => {
  const configuredSeverity = Object.prototype.hasOwnProperty.call(
    defaultRuleSeverities,
    id
  )
    ? defaultRuleSeverities[id]
    : undefined;

  return configuredSeverity ?? RULE_SEVERITY.ERROR;
};

/** Normalize configured rules into one record for each rule ID. */
export const normalizeRuleRegistry = (
  defaultRules: Record<string, LintMdRule>,
  ruleConfig: LintMdRulesConfig,
  defaultRuleSeverities: Readonly<
    Partial<Record<string, RULE_SEVERITY>>
  > = {}
): NormalizedRuleRegistry => {
  const registry = new Map<string, NormalizedRuleRecord>();
  const defaultRuleIds = new Set<string>();

  for (const rule of Object.values(defaultRules)) {
    const id = rule.meta.name;
    defaultRuleIds.add(id);
    registry.set(id, {
      id,
      configKey: id,
      rule,
      options: {},
      severity: getDefaultSeverity(id, defaultRuleSeverities)
    });
  }

  for (const [configKey, configValue] of Object.entries(ruleConfig)) {
    if (defaultRuleIds.has(configKey)) {
      const current = registry.get(configKey)!;

      if (typeof configValue === 'number') {
        registry.set(configKey, { ...current, severity: configValue });
      }
      else if (configValue.length === 2) {
        const [severity, options] = configValue;
        registry.set(configKey, { ...current, severity, options });
      }
      else {
        throw new Error(`[lint-md] 无效的规则配置 ${configKey}`);
      }
      continue;
    }

    if (!Array.isArray(configValue)) {
      throw new TypeError(`[lint-md] 未知规则 ${configKey} 的配置格式非法，第三方规则必须使用 [rule, severity, options] 形式`);
    }
    if (configValue.length !== 3) {
      throw new Error(`[lint-md] 第三方规则 ${configKey} 的配置长度必须为 3`);
    }

    const [rule, severity, options] = configValue;
    const id = rule.meta.name;
    const existing = registry.get(id);
    if (existing) {
      throw new TypeError(`[lint-md] 规则别名冲突：${id} 已被另一规则占用`);
    }

    registry.set(id, {
      id,
      configKey,
      rule,
      severity,
      options
    });
  }

  return registry;
};
