import type {
  LintMdRuleWithOptions,
  LintMdRulesConfig
} from '../types';
import * as internalRuleConfig from '../rules';
import { overrideDefaultRules } from '../utils/override-default-rules';
import { RULE_SEVERITY } from '../types';
import { runLint } from './run-lint';
import { handleFixMode } from './handle-fix-mode';

export const lintMarkdownInternal = (markdown: string, rules: LintMdRuleWithOptions[], isFixMode: boolean) => {
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
 */
export const lintMarkdown = (markdown: string, rules: LintMdRulesConfig = {}, isFixMode = true) => {
  // 基于用户配置覆盖默认配置
  const registeredRules = overrideDefaultRules(internalRuleConfig, rules);

  const registeredRuleEntries = Object.entries(registeredRules);

  // 最终的 rules
  const internalRules = registeredRuleEntries
    .filter((item) => {
      // 过滤掉 severity 为 0 的规则，提高性能
      return item[1].severity !== RULE_SEVERITY.OFF;
    })
    .map((options) => {
      const value = options[1];
      return {
        rule: value.rule,
        options: value.options
      };
    });

  const { fixedResult, lintResult } = lintMarkdownInternal(markdown, internalRules, isFixMode);

  const reportDataWithSeverity = lintResult?.ruleManager.getReportData().map((item) => {
    const { loc, message, name, content } = item;
    return {
      loc,
      message,
      name,
      content,
      severity: registeredRules[name].severity
    };
  });

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
    fixedResult
  };
};
