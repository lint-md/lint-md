import { Fix, LintMdRule } from '../types';
import { applyFix } from '../utils/apply-fix';
import { MAX_LINT_AND_FIX_CALL_TIMES } from '../common/constant';
import { lintMarkdown } from './lint-markdown';

/**
 * 核心方法，对某个 Markdown 文本进行 lint 或者 fix
 *
 * @date 2021-12-14 17:16:12
 */
export const lintAndFix = (markdown: string, rules: LintMdRule[], isFixMode: boolean) => {
  let lintTimes = 0;
  let lintResult = lintMarkdown(markdown, rules);

  let fixedResult: { result: string, notAppliedFixes: Fix[] } = null;

  while (isFixMode && lintTimes <= MAX_LINT_AND_FIX_CALL_TIMES) {
    lintTimes += 1;
    fixedResult = applyFix(markdown, lintResult.ruleContext.getAllFixes());
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
