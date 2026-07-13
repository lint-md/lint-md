import type { FixConfig, FixMetrics, LintMdRuleWithOptions } from '../types';
import { FixConvergence } from '../types';
import { MAX_LINT_AND_FIX_CALL_TIMES } from '../common/constant';
import { applyFix } from '../utils/apply-fix';
import { runLint } from './run-lint';

export const handleFixMode = (markdown: string, rules: LintMdRuleWithOptions[]) => {
  let lintTimes = 0;
  let initialLintResult = {} as ReturnType<typeof runLint>;

  let current = markdown;
  let lastNotAppliedFixes: FixConfig[] = [];

  // 记录已处理过的文本状态，用于检测振荡循环（如 A -> B -> A）。
  const seenTexts = new Set<string>();
  let convergence: FixConvergence | undefined;

  // 性能基线：仅记录每轮 wall time 与整体耗时，不拆分 parse/规则成本。
  const perRound: number[] = [];
  const startAll = performance.now();

  while (lintTimes < MAX_LINT_AND_FIX_CALL_TIMES) {
    // 循环检测：在执行某轮 current 之前，判断该文本是否已被处理过。
    // 这样 A -> B -> A 只会执行 2 轮、最终返回实际已应用的 A。
    if (seenTexts.has(current)) {
      convergence = FixConvergence.CYCLE_DETECTED;
      break;
    }
    seenTexts.add(current);

    const roundStart = performance.now();
    const lintResult = runLint(current, rules);
    perRound.push(performance.now() - roundStart);

    if (lintTimes === 0) {
      initialLintResult = lintResult;
    }

    lintTimes++;

    const fixes = lintResult.ruleManager.getAllFixes();

    // 无 fix 可应用 => 正常收敛。
    if (!fixes.length) {
      convergence = FixConvergence.STABLE;
      break;
    }

    const nextFixedResult = applyFix(current, fixes);

    // 仅保留最后一轮 applyFix 返回的 notAppliedFixes
    // 不跨轮累积：不同轮次的 fix range 基于各自输入文本，跨轮混用会导致 range 失效
    lastNotAppliedFixes = nextFixedResult.notAppliedFixes;

    // 文本不再变化 => 正常收敛（即便该轮存在冲突未应用的 fix）。
    if (nextFixedResult.result === current) {
      convergence = FixConvergence.STABLE;
      break;
    }

    current = nextFixedResult.result;
  }

  // 走到上限仍未收敛 => 被截断。
  if (!convergence) {
    convergence = FixConvergence.MAX_ROUNDS;
  }

  const fixedResult = {
    result: current,
    notAppliedFixes: lastNotAppliedFixes,
    convergence,
    rounds: lintTimes,
    metrics: {
      rounds: lintTimes,
      wallTime: performance.now() - startAll,
      perRound
    } as FixMetrics
  };

  return {
    lintResult: initialLintResult,
    fixedResult
  };
};
