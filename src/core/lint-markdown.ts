import type {
  FixedResult,
  LintMdFixResult,
  LintMdLintResult,
  LintMdResult,
  LintMdRule,
  LintMdRuleWithOptions,
  LintMdRulesConfig,
  LintReportItem
} from '../types';
import * as internalRuleConfig from '../rules';
import { overrideDefaultRules } from '../utils/override-default-rules';
import { RULE_SEVERITY } from '../types';
import { runLint } from './run-lint';
import { handleFixMode } from './handle-fix-mode';

export const lintMarkdownInternal = (
  markdown: string,
  rules: LintMdRuleWithOptions[],
  isFixMode: boolean
): { lintResult: ReturnType<typeof runLint>; fixedResult: FixedResult | null } => {
  if (!isFixMode) {
    const lintResult = runLint(markdown, rules);
    return {
      lintResult,
      fixedResult: null
    };
  }
  else {
    return handleFixMode(markdown, rules);
  }
};

/**
 * 核心方法，对某个 Markdown 文本进行 lint 或者 fix
 *
 * @date 2021-12-14 17:16:12
 *    默认开启 fix 模式：
 * - isFixMode=true 或省略时，fixedResult 为 FixedResult
 * - isFixMode=false 时，fixedResult 为 null
 * - isFixMode 为 boolean 变量时，返回联合类型
 */
export function lintMarkdown(markdown: string, rules?: LintMdRulesConfig, isFixMode?: true): LintMdFixResult;
export function lintMarkdown(markdown: string, rules?: LintMdRulesConfig, isFixMode?: false): LintMdLintResult;
export function lintMarkdown(markdown: string, rules?: LintMdRulesConfig, isFixMode?: boolean): LintMdResult;
export function lintMarkdown(markdown: string, rules: LintMdRulesConfig = {}, isFixMode = true): LintMdResult {
  // 基于用户配置覆盖默认配置
  const registeredRules = overrideDefaultRules(internalRuleConfig, rules);

  const registeredRuleEntries = Object.entries(registeredRules);

  // 最终的 rules
  // 注意：注册表可能包含同一规则的多条记录（配置键 + meta.name 别名），
  // 这里按 rule 引用去重，避免规则被重复执行导致报告与计数翻倍。
  const seenRules = new Set<LintMdRule>();
  const internalRules = registeredRuleEntries
    .filter((item) => {
      const value = item[1];
      // 过滤掉 severity 为 0 的规则，提高性能
      if (value.severity === RULE_SEVERITY.OFF) {
        return false;
      }
      // 同一 rule 只保留一次（配置键与 meta.name 别名指向同一记录）
      if (seenRules.has(value.rule)) {
        return false;
      }
      seenRules.add(value.rule);
      return true;
    })
    .map((options) => {
      const value = options[1];
      return {
        rule: value.rule,
        options: value.options
      };
    });

  const { fixedResult, lintResult } = lintMarkdownInternal(markdown, internalRules, isFixMode);

  const reportData = lintResult?.ruleManager.getReportData();
  let fixableErrorCount = 0;
  let fixableWarningCount = 0;

  const reportDataWithSeverity: LintReportItem[] = reportData?.map((item) => {
    const severity = registeredRules[item.name].severity as RULE_SEVERITY;

    if (typeof item.fix === 'function') {
      if (severity === RULE_SEVERITY.ERROR) {
        fixableErrorCount++;
      }
      else if (severity === RULE_SEVERITY.WARN) {
        fixableWarningCount++;
      }
    }

    const { loc, message, name, content } = item;
    return {
      loc,
      message,
      name,
      content,
      severity
    };
  }) ?? [];

  const diagnostics = (reportDataWithSeverity ?? []).map(item => ({
    line: item.loc.start.line,
    column: item.loc.start.column,
    ruleId: item.name,
    message: item.message,
    severity: item.severity
  }));

  return {
    lintResult: reportDataWithSeverity,
    diagnostics,
    fixedResult,
    fixableErrorCount,
    fixableWarningCount
  };
}
