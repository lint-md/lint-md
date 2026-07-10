import type { FixConfig, LintMdRuleWithOptions } from '../types';
import { MAX_LINT_AND_FIX_CALL_TIMES } from '../common/constant';
import { applyFix } from '../utils/apply-fix';
import { runLint } from './run-lint';

export const handleFixMode = (markdown: string, rules: LintMdRuleWithOptions[]) => {
  let lintTimes = 0;
  let initialLintResult = {} as ReturnType<typeof runLint>;

  let current = markdown;
  let fixedResult: { result: string; notAppliedFixes: FixConfig[] } = {
    result: markdown,
    notAppliedFixes: []
  };

  while (lintTimes < MAX_LINT_AND_FIX_CALL_TIMES) {
    const lintResult = runLint(current, rules);

    if (lintTimes === 0) {
      initialLintResult = lintResult;
    }

    lintTimes++;

    const fixes = lintResult.ruleManager.getAllFixes();

    if (!fixes.length) {
      fixedResult = {
        result: current,
        notAppliedFixes: []
      };
      break;
    }

    const nextFixedResult = applyFix(current, fixes);

    if (nextFixedResult.result === current) {
      fixedResult = nextFixedResult;
      break;
    }

    fixedResult = nextFixedResult;
    current = nextFixedResult.result;
  }

  return {
    lintResult: initialLintResult,
    fixedResult
  };
};
