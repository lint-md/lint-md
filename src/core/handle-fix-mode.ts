import type {
  FixedResult,
  LintMdRuleWithOptions,
  NotAppliedFix,
  RuleExecutionError
} from '../types';
import { FixConvergence } from '../types';
import { MAX_LINT_AND_FIX_CALL_TIMES } from '../common/constant';
import { applyFix } from '../utils/apply-fix';
import { now } from '../utils/time';
import type { RunLintResult } from './run-lint';
import { runLint } from './run-lint';

interface RunFixLoopOptions {
  runRound: (
    markdown: string,
    rules: LintMdRuleWithOptions[],
    round: number
  ) => RunLintResult
  now: () => number
  maxRounds: number
}

interface FixLoopResult {
  lintResult: RunLintResult
  fixedResult: FixedResult
  executionErrors: RuleExecutionError[]
}

export const runFixLoop = (
  markdown: string,
  rules: LintMdRuleWithOptions[],
  options: RunFixLoopOptions
): FixLoopResult => {
  const { runRound, now: readTime, maxRounds } = options;

  if (!Number.isInteger(maxRounds) || maxRounds < 1) {
    throw new TypeError('[lint-md] maxRounds must be a positive integer');
  }

  let rounds = 0;
  let initialLintResult!: RunLintResult;
  const executionErrors: RuleExecutionError[] = [];
  let current = markdown;
  let lastNotAppliedFixes: NotAppliedFix[] = [];
  const seenTexts = new Set<string>();
  let convergence: FixConvergence | undefined;
  const perRound: number[] = [];
  const startAll = readTime();

  while (rounds < maxRounds) {
    const roundStart = readTime();
    seenTexts.add(current);

    const lintResult = runRound(current, rules, rounds);

    if (rounds === 0) {
      initialLintResult = lintResult;
    }

    rounds++;
    executionErrors.push(...lintResult.executionErrors);

    if (!lintResult.fixes.length) {
      lastNotAppliedFixes = [];
      convergence = FixConvergence.STABLE;
    }
    else {
      const nextFixedResult = applyFix(current, [...lintResult.fixes]);
      lastNotAppliedFixes = nextFixedResult.notAppliedFixes;

      if (nextFixedResult.result === current) {
        convergence = FixConvergence.STABLE;
      }
      else {
        current = nextFixedResult.result;

        if (seenTexts.has(current)) {
          convergence = FixConvergence.CYCLE_DETECTED;
        }
      }
    }

    perRound.push(readTime() - roundStart);

    if (convergence) {
      break;
    }
  }

  const fixedResult: FixedResult = {
    result: current,
    notAppliedFixes: lastNotAppliedFixes,
    convergence: convergence ?? FixConvergence.MAX_ROUNDS,
    rounds,
    metrics: {
      rounds,
      wallTime: readTime() - startAll,
      perRound
    }
  };

  return {
    lintResult: initialLintResult,
    fixedResult,
    executionErrors
  };
};

export const handleFixMode = (
  markdown: string,
  rules: LintMdRuleWithOptions[],
  policy: 'collect' | 'strict' = 'collect'
): FixLoopResult => runFixLoop(markdown, rules, {
  runRound: (current, currentRules, round) => runLint(current, currentRules, {
    ruleErrorPolicy: policy,
    round,
    computeFixes: true
  }),
  now,
  maxRounds: MAX_LINT_AND_FIX_CALL_TIMES
});
