import { builtInRules } from '../rules/builtins';
import type { LintMdRule, LintMdRuleWithOptions, LintMdRulesConfig } from '../types';
import { RULE_SEVERITY } from '../types';

interface RegisteredRule {
  rule: LintMdRule
  options: Record<string, any>
  severity: RULE_SEVERITY
}

interface ResolvedRuleCatalog {
  getSeverity: (name: string) => RULE_SEVERITY
  rules: LintMdRuleWithOptions[]
}

const cloneRule = (registeredRule: RegisteredRule): RegisteredRule => {
  return {
    rule: registeredRule.rule,
    options: { ...registeredRule.options },
    severity: registeredRule.severity
  };
};

const createBuiltins = () => {
  return new Map<string, RegisteredRule>(
    builtInRules.map(rule => [rule.meta.name, {
      rule,
      options: {},
      severity: RULE_SEVERITY.ERROR
    }])
  );
};

export class RuleCatalog {
  private builtins: Map<string, RegisteredRule>;

  constructor(builtins = createBuiltins()) {
    this.builtins = builtins;
  }

  resolve(config: LintMdRulesConfig): ResolvedRuleCatalog {
    const resolved = new Map<string, RegisteredRule>();

    for (const [name, registeredRule] of this.builtins.entries()) {
      resolved.set(name, cloneRule(registeredRule));
    }

    for (const [ruleName, configValue] of Object.entries(config)) {
      const target = resolved.get(ruleName);

      if (target) {
        if (typeof configValue === 'number') {
          target.severity = configValue;
        }
        else if (Array.isArray(configValue) && configValue.length === 2) {
          const [severity, options] = configValue;
          target.severity = severity as RULE_SEVERITY;
          target.options = options as Record<string, any>;
        }
        else {
          throw new Error(`[lint-md] 无效的规则配置 ${ruleName}`);
        }
      }
      else {
        if (Array.isArray(configValue) && configValue.length === 3) {
          const [rule, severity, options] = configValue;
          resolved.set(ruleName, {
            rule: rule as LintMdRule,
            severity: severity as RULE_SEVERITY,
            options: options as Record<string, any>
          });
        }
        else {
          throw new Error(`[lint-md] 第三方规则 ${ruleName} 的配置长度必须为 3`);
        }
      }
    }

    return {
      rules: [...resolved.values()]
        .filter(item => item.severity !== RULE_SEVERITY.OFF)
        .map(({ rule, options }) => ({ rule, options })),
      getSeverity: (name: string) => {
        return resolved.get(name)?.severity ?? RULE_SEVERITY.ERROR;
      }
    };
  }
}

export const ruleCatalog = new RuleCatalog();
