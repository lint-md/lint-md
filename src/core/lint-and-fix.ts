import * as path from 'path';
import {
  FixConfig,
  LintMdRule,
  LintMdRuleWithOptions,
  LintMdRulesConfig
} from '../types';
import { applyFix } from '../utils/apply-fix';
import { MAX_LINT_AND_FIX_CALL_TIMES } from '../common/constant';
import { overrideDefaultRules } from '../utils/override-default-rules';
import { lintMarkdown } from './lint-markdown';

/**
 * 核心方法，对某个 Markdown 文本进行 lint 或者 fix
 *
 * @date 2021-12-14 17:16:12
 */
export const lintAndFixInternal = (markdown: string, rules: LintMdRuleWithOptions[], isFixMode: boolean) => {
  let lintTimes = 0;
  let lintResult = lintMarkdown(markdown, rules);

  let fixedResult: { result: string, notAppliedFixes: FixConfig[] } = null;

  while (isFixMode && lintTimes <= MAX_LINT_AND_FIX_CALL_TIMES) {
    lintTimes += 1;
    fixedResult = applyFix(markdown, lintResult.ruleManager.getAllFixes());
    if (!fixedResult.notAppliedFixes.length) {
      break;
    }
    lintResult = lintMarkdown(markdown, rules);
  }

  return {
    lintResult: lintResult,
    fixedResult: fixedResult
  };
};


export const lintAndFix = (markdown: string, rules: LintMdRulesConfig = {}, isFixMode = true) => {
  // 获取内部 rules
  const internalRuleConfig: Record<string, LintMdRule> = require(path.resolve(__dirname, '../rules'));

  // 基于用户配置覆盖默认配置
  const registeredRules = overrideDefaultRules(internalRuleConfig, rules);

  const registeredRuleEntries = Object.entries(registeredRules);

  // 最终的 rules
  const internalRules = registeredRuleEntries.map((options) => {
    const value = options[1];
    return {
      rule: value.rule,
      options: value.options
    };
  });

  const lintAndFixResult = lintAndFixInternal(markdown, internalRules, isFixMode);

  const { fixedResult: { result, notAppliedFixes }, lintResult } = lintAndFixResult;

  const reportDataWithSeverity = lintResult.ruleManager.getReportData().map(item => {
    const { loc, message, name } = item;
    return {
      loc, message, name,
      severity: registeredRules[name].severity
    };
  });


  return {
    fixedContent: result,
    notAppliedFixes,
    reportData: reportDataWithSeverity
  };
};
