import type { LintMdRule, LintMdRulesConfig, RegisteredRules } from '../types';
import { RULE_SEVERITY } from '../types';

/**
 * 覆盖默认规则
 *
 * @author YuZhanglong <loveyzl1123@gmail.com>
 */
export const overrideDefaultRules = (defaultRules: Record<string, LintMdRule>, ruleConfig: LintMdRulesConfig) => {
  // 默认所有的内部 rules 都会被初始化，等级为 Error，参数为空
  // 使用无原型对象，避免 __proto__/constructor/toString 等键从原型链误读，
  // 防止原型污染（见 issue #177 后续反馈）。
  const registeredRules = Object.create(null) as RegisteredRules;

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
    const targetRule = Object.prototype.hasOwnProperty.call(registeredRules, ruleName)
      ? registeredRules[ruleName]
      : undefined;

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
      else {
        // 未知规则且配置不是数组（如拼写错误的规则名配了一个数字），不再静默忽略。
        throw new TypeError(`[lint-md] 未知规则 ${ruleName} 的配置格式非法，第三方规则必须使用 [rule, severity, options] 形式`);
      }
    }
  }

  // 收敛规则身份：第三方规则按用户配置键存入注册表，但报告阶段是用
  // rule.meta.name 回查注册表的。当配置键与 meta.name 不一致时，回查会失败
  // 并抛出 TypeError。这里为每个注册记录按其 meta.name 建立别名，使报告名称
  // 仍能命中同一记录，从而修复崩溃且无需推翻既有注册结构。
  for (const [configKey, record] of Object.entries(registeredRules)) {
    const nameKey = record.rule.meta.name;

    // 配置键即 meta.name，无需建别名。
    if (configKey === nameKey) {
      continue;
    }

    // 只要 nameKey 已被另一个（不同的）注册记录占用，就报冲突——
    // 不区分内置/第三方，也不比较 rule 对象身份：
    //  1. 阻止第三方规则通过 meta.name 静默覆盖内置规则；
    //  2. 阻止不同配置键占用同一 meta.name；
    //  3. 阻止同一 rule 对象被多个配置键重复注册（options/severity 错配）。
    const existing = registeredRules[nameKey];

    if (existing && existing !== record) {
      throw new TypeError(`[lint-md] 规则别名冲突：${nameKey} 已被另一规则占用`);
    }

    registeredRules[nameKey] = record;
  }

  return registeredRules;
};
