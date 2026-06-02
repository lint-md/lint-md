import type { LintMdRuleWithOptions, LintMdRulesConfig } from '../types';
import { ruleCatalog } from '../utils/rule-catalog';
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

export const lintMarkdown = (markdown: string, rules: LintMdRulesConfig = {}, isFixMode = true) => {
  const resolvedRuleCatalog = ruleCatalog.resolve(rules);

  const { fixedResult, lintResult } = lintMarkdownInternal(markdown, resolvedRuleCatalog.rules, isFixMode);

  const reportDataWithSeverity = lintResult?.ruleManager.getReportData().map((item) => {
    const { loc, message, name, content } = item;
    return {
      loc,
      message,
      name,
      content,
      severity: resolvedRuleCatalog.getSeverity(name),
    };
  });

  return {
    lintResult: reportDataWithSeverity,
    fixedResult
  };
};
