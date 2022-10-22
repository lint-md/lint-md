import * as path from 'path';
import {
  LintMdRule,
  LintMdRuleWithOptions,
  LintMdRulesConfig,
  FixConfig
} from '../types';
import { applyFix } from '../utils/apply-fix';
import { MAX_LINT_AND_FIX_CALL_TIMES } from '../common/constant';
import { overrideDefaultRules } from '../utils/override-default-rules';
import { lintMarkdown } from './lint-markdown';

export const handleFixMode = (markdown: string, rules: LintMdRuleWithOptions[]) => {
  let lintTimes = 0;
  let initialLintResult = {} as ReturnType<typeof lintMarkdown>;

  let fixedResult: { result: string, notAppliedFixes: FixConfig[] } = {
    result: markdown,
    notAppliedFixes: []
  };

  while (lintTimes <= MAX_LINT_AND_FIX_CALL_TIMES) {
    // 1. 先 lint
    const lintResult = lintMarkdown(fixedResult.result, rules);

    lintTimes += 1;

    // 第一次的 lint 操作需要作为 lint 结果保存起来
    if (lintTimes === 1) {
      initialLintResult = lintResult;
    }

    // 2. 尝试修复
    fixedResult = applyFix(fixedResult.result, lintResult.ruleManager.getAllFixes());

    // 4. 没有剩余的修复项，退出循环
    if (!fixedResult.notAppliedFixes.length) {
      break;
    }
  }

  return {
    lintResult: initialLintResult,
    fixedResult
  };
};

/**
 * 核心方法，对某个 Markdown 文本进行 lint 或者 fix
 *
 * @date 2021-12-14 17:16:12
 */
export const lintAndFixInternal = (markdown: string, rules: LintMdRuleWithOptions[], isFixMode: boolean) => {
  if (!isFixMode) {
    const lintResult = lintMarkdown(markdown, rules);
    return {
      lintResult,
      fixedResult: null
    };
  } else {
    return handleFixMode(markdown, rules);
  }
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

  const { fixedResult, lintResult } = lintAndFixInternal(markdown, internalRules, isFixMode);

  const reportDataWithSeverity = lintResult?.ruleManager.getReportData().map(item => {
    const { loc, message, name } = item;
    return {
      loc, message, name,
      severity: registeredRules[name].severity
    };
  });


  return {
    lintResult: reportDataWithSeverity,
    fixedResult
  };
};
