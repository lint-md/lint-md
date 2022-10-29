import type { FixConfig, LintMdRuleWithOptions } from '../types';
import { MAX_LINT_AND_FIX_CALL_TIMES } from '../common/constant';
import { applyFix } from '../utils/apply-fix';
import { runLint } from './run-lint';

export const handleFixMode = (markdown: string, rules: LintMdRuleWithOptions[]) => {
  let lintTimes = 0;
  let initialLintResult = {} as ReturnType<typeof runLint>;

  let fixedResult: { result: string; notAppliedFixes: FixConfig[] } = {
    result: markdown,
    notAppliedFixes: []
  };

  while (lintTimes <= MAX_LINT_AND_FIX_CALL_TIMES) {
    // 1. 先 lint
    const lintResult = runLint(fixedResult.result, rules);

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
