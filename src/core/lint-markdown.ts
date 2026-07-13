import type {
  FixedResult,
  LintExecutionOptions,
  LintMdFixResult,
  LintMdLintResult,
  LintMdResult,
  LintMdRuleWithOptions,
  LintMdRulesConfig,
  LintReportItem,
  RegisteredRules
} from '../types';
import * as internalRuleConfig from '../rules';
import { overrideDefaultRules } from '../utils/override-default-rules';
import { RULE_SEVERITY } from '../types';
import { runLint } from './run-lint';
import { handleFixMode } from './handle-fix-mode';

export const lintMarkdownInternal = (
  markdown: string,
  rules: LintMdRuleWithOptions[],
  isFixMode: boolean,
  policy: 'collect' | 'strict' = 'collect'
): {
  lintResult: ReturnType<typeof runLint>
  fixedResult: FixedResult | null
  executionErrors: ReturnType<typeof runLint>['executionErrors']
} => {
  if (!isFixMode) {
    const lintResult = runLint(markdown, rules, { ruleErrorPolicy: policy });
    return {
      lintResult,
      fixedResult: null,
      executionErrors: lintResult.executionErrors
    };
  }
  else {
    const { lintResult, fixedResult, executionErrors } = handleFixMode(markdown, rules, policy);
    return {
      lintResult,
      fixedResult,
      executionErrors
    };
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
export function lintMarkdown(markdown: string, rules?: LintMdRulesConfig, isFixMode?: true, options?: LintExecutionOptions): LintMdFixResult;
export function lintMarkdown(markdown: string, rules?: LintMdRulesConfig, isFixMode?: false, options?: LintExecutionOptions): LintMdLintResult;
export function lintMarkdown(markdown: string, rules?: LintMdRulesConfig, isFixMode?: boolean, options?: LintExecutionOptions): LintMdResult;
export function lintMarkdown(markdown: string, rules: LintMdRulesConfig = {}, isFixMode = true, options: LintExecutionOptions = {}): LintMdResult {
  // 基于用户配置覆盖默认配置
  const registeredRules = overrideDefaultRules(internalRuleConfig, rules);

  const registeredRuleEntries = Object.entries(registeredRules);

  // 最终的 rules
  // 注意：注册表可能为同一注册记录建立过别名（配置键 + meta.name 指向同一对象），
  // 这里按注册记录引用去重，避免规则被重复执行导致报告与计数翻倍。
  // 按记录（而非 rule）去重很重要：当同一个 rule 对象被两个配置键复用时，
  // 它们是不同的注册记录（不同 severity/options），冲突检查已在注册阶段阻止，
  // 此处不会遇到这种情况，但按记录去重更能与注册表契约保持一致。
  const seenRecords = new Set<RegisteredRules[string]>();
  const internalRules = registeredRuleEntries
    .filter((item) => {
      const value = item[1];
      // 过滤掉 severity 为 0 的规则，提高性能
      if (value.severity === RULE_SEVERITY.OFF) {
        return false;
      }
      // 同一注册记录只保留一次（配置键与 meta.name 别名指向同一对象）
      if (seenRecords.has(value)) {
        return false;
      }
      seenRecords.add(value);
      return true;
    })
    .map((options) => {
      const value = options[1];
      return {
        rule: value.rule,
        options: value.options
      };
    });

  const policy = options.ruleErrorPolicy ?? 'collect';
  const { fixedResult, lintResult, executionErrors } = lintMarkdownInternal(markdown, internalRules, isFixMode, policy);

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
    fixableWarningCount,
    executionErrors
  };
}
