import type { FixConfig, FixMetrics, LintMdRuleWithOptions } from '../types';
import { FixConvergence } from '../types';
import { MAX_LINT_AND_FIX_CALL_TIMES } from '../common/constant';
import { applyFix } from '../utils/apply-fix';
import { runLint } from './run-lint';

export const handleFixMode = (
  markdown: string,
  rules: LintMdRuleWithOptions[],
  policy: 'collect' | 'strict' = 'collect'
) => {
  let lintTimes = 0;
  let initialLintResult = {} as ReturnType<typeof runLint>;

  // 聚合所有 fix 轮次的规则执行错误（lint-only 恒为 0 轮）；严格模式下任一失败即抛 RuleExecutionFailure。
  const allExecutionErrors: ReturnType<typeof runLint>['executionErrors'] = [];

  let current = markdown;
  let lastNotAppliedFixes: FixConfig[] = [];

  // 记录已处理过的文本状态，用于检测振荡循环（如 A -> B -> A）。
  const seenTexts = new Set<string>();
  let convergence: FixConvergence | undefined;

  // 性能基线：记录每一轮完整 wall time（parse + AST 遍历 + 规则执行 + applyFix）。
  const perRound: number[] = [];
  const startAll = performance.now();

  while (lintTimes < MAX_LINT_AND_FIX_CALL_TIMES) {
    const roundStart = performance.now();

    // 记录本轮输入文本，供后续判断是否回到历史状态。
    seenTexts.add(current);

    const lintResult = runLint(current, rules, { ruleErrorPolicy: policy, round: lintTimes });

    if (lintTimes === 0) {
      initialLintResult = lintResult;
    }

    lintTimes++;

    // 先取 fix 列表：fix() 回调在 getAllFixes() 内执行，其错误已并入 ruleManager 的 collector，
    // 并反映到 runLint 返回的 executionErrors 中。聚合必须放在 getAllFixes 之后，否则会丢 fix 阶段错误。
    const fixes = lintResult.ruleManager.getAllFixes();

    // 累加本轮错误（含 create/selector 与 fix 阶段；严格模式下可能已抛 RuleExecutionFailure）。
    // `runLint().executionErrors` 是调用完成时的快照；fix() 在 getAllFixes()
    // 中才会执行，因此这里从 manager 重新读取，确保本轮 fix 阶段错误也被聚合。
    allExecutionErrors.push(...lintResult.ruleManager.getExecutionErrors());

    // 无 fix 可应用 => 正常收敛。
    if (!fixes.length) {
      perRound.push(performance.now() - roundStart);
      convergence = FixConvergence.STABLE;
      break;
    }

    const nextFixedResult = applyFix(current, fixes);

    // 仅保留最后一轮 applyFix 返回的 notAppliedFixes
    // 不跨轮累积：不同轮次的 fix range 基于各自输入文本，跨轮混用会导致 range 失效
    lastNotAppliedFixes = nextFixedResult.notAppliedFixes;

    // 文本不再变化 => 正常收敛（即便该轮存在冲突未应用的 fix）。
    if (nextFixedResult.result === current) {
      perRound.push(performance.now() - roundStart);
      convergence = FixConvergence.STABLE;
      break;
    }

    current = nextFixedResult.result;

    // 文本回到了某个已处理过的状态 => 检测到循环，提前停止。
    // 放在文本不变判断之后，自替换规则仍归类为 STABLE。
    if (seenTexts.has(current)) {
      perRound.push(performance.now() - roundStart);
      convergence = FixConvergence.CYCLE_DETECTED;
      break;
    }

    perRound.push(performance.now() - roundStart);
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
    fixedResult,
    executionErrors: allExecutionErrors
  };
};
