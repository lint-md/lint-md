import type { LintMdRule, LintMdRulesConfig, RegisteredRules } from '../types';
import { RULE_SEVERITY } from '../types';

/**
 * 覆盖默认规则
 *
 * @author YuZhanglong <loveyzl1123@gmail.com>
 */
export const overrideDefaultRules = (defaultRules: Record<string, LintMdRule>, ruleConfig: LintMdRulesConfig) => {
  // 默认所有的内部 rules 都会被初始化，等级为 Error，参数为空
  const registeredRules: RegisteredRules = {};

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const [_, ruleValue] of Object.entries(defaultRules)) {
    registeredRules[ruleValue.meta.name] = {
      rule: ruleValue,
      options: {},
      severity: RULE_SEVERITY.ERROR
    };
  }

  // 将用户传入的 rules 合并到内部 rules 中
  for (const [ruleName, ruleConfigValue] of Object.entries(ruleConfig)) {
    // 如果配置的 rule 为内部 rule，覆盖之（只覆盖配置过的）
    const targetRule = registeredRules[ruleName];

    // 匹配到内部规则
    if (targetRule) {
      if (typeof ruleConfigValue === 'number') {
        targetRule.severity = ruleConfigValue;
      }
      else {
        if (ruleConfigValue.length === 2) {
          const [severity, options] = ruleConfigValue;
          targetRule.severity = severity;
          targetRule.options = options;
        }
        else {
          throw new Error(`[lint-md] 无效的规则配置 ${ruleName}`);
        }
      }
    }
    else {
      // 第三方规则，长度只能为 3
      if (Array.isArray(ruleConfigValue)) {
        if (ruleConfigValue.length === 3) {
          const [config, severity, options] = ruleConfigValue;
          registeredRules[ruleName] = {
            severity,
            rule: config,
            options
          };
        }
        else {
          throw new Error(`[lint-md] 第三方规则 ${ruleName} 的配置长度必须为 3`);
        }
      }
    }
  }

  return registeredRules;
};
