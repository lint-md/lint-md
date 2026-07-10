import type { FixConfig, LintMdRuleWithOptions } from '../types';
import { MAX_LINT_AND_FIX_CALL_TIMES } from '../common/constant';
import { applyFix } from '../utils/apply-fix';
import { runLint } from './run-lint';

export const handleFixMode = (markdown: string, rules: LintMdRuleWithOptions[]) => {
  let lintTimes = 0;
  let initialLintResult = {} as ReturnType<typeof runLint>;

  let current = markdown;
  let lastNotAppliedFixes: FixConfig[] = [];

  while (lintTimes < MAX_LINT_AND_FIX_CALL_TIMES) {
    const lintResult = runLint(current, rules);

    if (lintTimes === 0) {
      initialLintResult = lintResult;
    }

    lintTimes++;

    const fixes = lintResult.ruleManager.getAllFixes();

    if (!fixes.length) {
      break;
    }

    const nextFixedResult = applyFix(current, fixes);

    // 仅保留最后一轮 applyFix 返回的 notAppliedFixes
    // 不跨轮累积：不同轮次的 fix range 基于各自输入文本，跨轮混用会导致 range 失效
    lastNotAppliedFixes = nextFixedResult.notAppliedFixes;

    if (nextFixedResult.result === current) {
      break;
    }

    current = nextFixedResult.result;
  }

  const fixedResult = {
    result: current,
    notAppliedFixes: lastNotAppliedFixes
  };

  return {
    lintResult: initialLintResult,
    fixedResult
  };
};
