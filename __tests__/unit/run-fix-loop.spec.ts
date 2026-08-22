import { runFixLoop } from '../../src/core/handle-fix-mode';
import type { RunLintReport, RunLintResult } from '../../src/core/run-lint';
import type {
  LintMdRuleWithOptions,
  RuleExecutionError,
  RuleFixConfig
} from '../../src/types';
import {
  FixConvergence,
  FixNotAppliedReason,
  RULE_SEVERITY
} from '../../src/types';

const rules: LintMdRuleWithOptions[] = [];

const makeFix = (
  text: string,
  range: readonly [number, number] = [0, 1],
  targetRule = 'test-rule'
): RuleFixConfig => ({ range, text, targetRule });

const makeRound = (
  overrides: Partial<RunLintResult> = {}
): RunLintResult => ({
  reports: [],
  fixes: [],
  executionErrors: [],
  fallbackHits: 0,
  ...overrides
});

const makeReport = (message: string): RunLintReport => ({
  name: 'test-rule',
  content: 'A',
  message,
  loc: {
    start: { line: 1, column: 1, offset: 0 },
    end: { line: 1, column: 2, offset: 1 }
  },
  range: {
    start: { line: 1, column: 1, offset: 0 },
    end: { line: 1, column: 2, offset: 1 }
  },
  severity: RULE_SEVERITY.ERROR
});

describe('runFixLoop', () => {
  test.each([0, -1, 1.5])('rejects invalid maxRounds value %p', (maxRounds) => {
    expect(() => runFixLoop('A', rules, {
      runRound: () => makeRound(),
      now: () => 0,
      maxRounds
    })).toThrow('[lint-md] maxRounds must be a positive integer');
  });

  test('returns the first round and stops when no fixes exist', () => {
    const firstRound = makeRound({ reports: [makeReport('first')] });
    const runRound = jest.fn(() => firstRound);

    const result = runFixLoop('A', rules, {
      runRound,
      now: () => 0,
      maxRounds: 3
    });

    expect(runRound).toHaveBeenCalledWith('A', rules, 0);
    expect(runRound).toHaveBeenCalledTimes(1);
    expect(result.lintResult).toBe(firstRound);
    expect(result.fixedResult).toMatchObject({
      result: 'A',
      convergence: FixConvergence.STABLE,
      rounds: 1
    });
  });

  test('applies cascading fixes until a no-fix round', () => {
    const rounds = [
      makeRound({ fixes: [makeFix('B')] }),
      makeRound({ fixes: [makeFix('C')] }),
      makeRound()
    ];
    const inputs: Array<[string, number]> = [];

    const result = runFixLoop('A', rules, {
      runRound: (markdown, _rules, round) => {
        inputs.push([markdown, round]);
        return rounds[round];
      },
      now: () => 0,
      maxRounds: 5
    });

    expect(inputs).toStrictEqual([['A', 0], ['B', 1], ['C', 2]]);
    expect(result.fixedResult).toMatchObject({
      result: 'C',
      convergence: FixConvergence.STABLE,
      rounds: 3
    });
  });

  test('detects a cycle after the applied text repeats', () => {
    const rounds = [
      makeRound({ fixes: [makeFix('B')] }),
      makeRound({ fixes: [makeFix('A')] })
    ];

    const result = runFixLoop('A', rules, {
      runRound: (_markdown, _rules, round) => rounds[round],
      now: () => 0,
      maxRounds: 2
    });

    expect(result.fixedResult).toMatchObject({
      result: 'A',
      convergence: FixConvergence.CYCLE_DETECTED,
      rounds: 2
    });
  });

  test('propagates round adapter failures', () => {
    const failure = new Error('round failed');

    expect(() => runFixLoop('A', rules, {
      runRound: () => {
        throw failure;
      },
      now: () => 0,
      maxRounds: 1
    })).toThrow(failure);
  });

  test('stops at the injected round limit', () => {
    const runRound = jest.fn((markdown: string) => makeRound({
      fixes: [makeFix(`${markdown}${markdown}`, [0, markdown.length])]
    }));

    const result = runFixLoop('A', rules, {
      runRound,
      now: () => 0,
      maxRounds: 2
    });

    expect(runRound).toHaveBeenCalledTimes(2);
    expect(result.fixedResult).toMatchObject({
      result: 'AAAA',
      convergence: FixConvergence.MAX_ROUNDS,
      rounds: 2
    });
  });

  test('stops as stable when applied fixes do not change text', () => {
    const fixes = [
      makeFix('A', [0, 1], 'same'),
      makeFix('B', [0, 1], 'conflict')
    ];

    const result = runFixLoop('A', rules, {
      runRound: () => makeRound({ fixes }),
      now: () => 0,
      maxRounds: 3
    });

    expect(result.fixedResult).toMatchObject({
      result: 'A',
      convergence: FixConvergence.STABLE,
      rounds: 1
    });
    expect(result.fixedResult.notAppliedFixes).toStrictEqual([{
      ...fixes[1],
      reason: FixNotAppliedReason.OVERLAP
    }]);
    expect(fixes.map(fix => fix.targetRule)).toStrictEqual(['same', 'conflict']);
  });

  test('clears conflicts when a later round has no fixes', () => {
    const oldConflict = makeFix('X', [0, 1], 'old-conflict');
    const newConflict = makeFix('Y', [0, 1], 'new-conflict');
    const rounds = [
      makeRound({ fixes: [makeFix('B', [0, 1], 'first'), oldConflict] }),
      makeRound({ fixes: [makeFix('C', [0, 1], 'second'), newConflict] }),
      makeRound()
    ];

    const result = runFixLoop('A', rules, {
      runRound: (_markdown, _rules, round) => rounds[round],
      now: () => 0,
      maxRounds: 5
    });

    expect(result.fixedResult.notAppliedFixes).toStrictEqual([]);
  });

  test('does not reorder fixes returned by the round adapter', () => {
    const fixes = [
      makeFix('C', [1, 2], 'later'),
      makeFix('B', [0, 1], 'earlier')
    ];

    runFixLoop('AB', rules, {
      runRound: () => makeRound({ fixes }),
      now: () => 0,
      maxRounds: 1
    });

    expect(fixes.map(fix => fix.targetRule)).toStrictEqual(['later', 'earlier']);
  });

  test('aggregates execution errors across rounds', () => {
    const firstError: RuleExecutionError = {
      ruleName: 'first',
      message: 'first failure',
      round: 0,
      phase: 'selector'
    };
    const secondError: RuleExecutionError = {
      ruleName: 'second',
      message: 'second failure',
      round: 1,
      phase: 'fix'
    };
    const rounds = [
      makeRound({
        fixes: [makeFix('B')],
        executionErrors: [firstError]
      }),
      makeRound({ executionErrors: [secondError] })
    ];

    const result = runFixLoop('A', rules, {
      runRound: (_markdown, _rules, round) => rounds[round],
      now: () => 0,
      maxRounds: 3
    });

    expect(result.executionErrors).toStrictEqual([firstError, secondError]);
  });

  test('uses the injected clock for round and total metrics', () => {
    const readings = [10, 12, 17, 20, 28, 30];
    const readTime = jest.fn(() => readings.shift() as number);
    const rounds = [
      makeRound({ fixes: [makeFix('B')] }),
      makeRound()
    ];

    const result = runFixLoop('A', rules, {
      runRound: (_markdown, _rules, round) => rounds[round],
      now: readTime,
      maxRounds: 3
    });

    expect(result.fixedResult.metrics).toStrictEqual({
      rounds: 2,
      wallTime: 20,
      perRound: [5, 8]
    });
    expect(readTime).toHaveBeenCalledTimes(6);
  });
});
