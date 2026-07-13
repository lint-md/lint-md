import { handleFixMode } from '../../src/core/handle-fix-mode';
import { MAX_LINT_AND_FIX_CALL_TIMES } from '../../src/common/constant';
import type { LintMdRule, LintMdRuleContext, FixConfig } from '../../src/types';
import { FixConvergence } from '../../src/types';

function makeRule(config: {
  name: string;
  selector: string;
  reportFn: (ctx: LintMdRuleContext, node: any) => void;
}): LintMdRule {
  return {
    meta: { name: config.name },
    create: (ctx) => ({
      [config.selector]: (node: any) => config.reportFn(ctx, node)
    })
  };
}

describe('handleFixMode', () => {
  test('no fixes available — exits immediately', () => {
    const rule = makeRule({
      name: 'no-op',
      selector: 'text',
      reportFn: () => { /* no report */ }
    });

    const result = handleFixMode('hello world', [{ rule }]);
    expect(result.fixedResult.result).toBe('hello world');
    expect(result.fixedResult.notAppliedFixes).toStrictEqual([]);
  });

  test('single fix applied cleanly', () => {
    const rule = makeRule({
      name: 'replace-foo',
      selector: 'text',
      reportFn: (ctx, node) => {
        if (node.value === 'foo') {
          ctx.report({
            loc: node.position,
            message: 'replace foo',
            fix: () => ({ range: [node.position.start.offset, node.position.end.offset], text: 'bar' })
          });
        }
      }
    });

    const result = handleFixMode('foo', [{ rule }]);
    expect(result.fixedResult.result).toBe('bar');
    expect(result.fixedResult.notAppliedFixes).toStrictEqual([]);
  });

  test('cascading fix — round 1 fix triggers round 2 violation', () => {
    // Rule A: replace "aa" with "bb"
    // Rule B: replace "bb" with "cc"
    // Round 1: "aa" → "bb" (rule A fixes)
    // Round 2: "bb" → "cc" (rule B fixes on new text)
    const ruleA = makeRule({
      name: 'a-aa-to-bb',
      selector: 'text',
      reportFn: (ctx, node) => {
        if (node.value === 'aa') {
          ctx.report({
            loc: node.position,
            message: 'replace aa',
            fix: () => ({
              range: [node.position.start.offset, node.position.end.offset],
              text: 'bb'
            })
          });
        }
      }
    });

    const ruleB = makeRule({
      name: 'b-bb-to-cc',
      selector: 'text',
      reportFn: (ctx, node) => {
        if (node.value === 'bb') {
          ctx.report({
            loc: node.position,
            message: 'replace bb',
            fix: () => ({
              range: [node.position.start.offset, node.position.end.offset],
              text: 'cc'
            })
          });
        }
      }
    });

    const result = handleFixMode('aa', [{ rule: ruleA }, { rule: ruleB }]);
    expect(result.fixedResult.result).toBe('cc');
    expect(result.fixedResult.notAppliedFixes).toStrictEqual([]);
  });

  test('conflict fixes — overlapping ranges, only one applied', () => {
    // Two rules both target the same text node with overlapping ranges.
    // Rule A: [0, 3) → "X"  (wider range)
    // Rule B: [1, 2) → "Y"  (narrower range, conflicts with A)
    // Round 1: A wins (first in sort), B is notAppliedFixes
    // Round 2: text is "X", no violations → exit
    const ruleA = makeRule({
      name: 'wide-replace',
      selector: 'text',
      reportFn: (ctx, node) => {
        if (node.value === 'abc') {
          ctx.report({
            loc: node.position,
            message: 'wide replace',
            fix: () => ({
              range: [node.position.start.offset, node.position.end.offset],
              text: 'X'
            })
          });
        }
      }
    });

    const ruleB = makeRule({
      name: 'narrow-replace',
      selector: 'text',
      reportFn: (ctx, node) => {
        if (node.value === 'abc') {
          const start = node.position.start.offset;
          ctx.report({
            loc: node.position,
            message: 'narrow replace',
            fix: () => ({
              range: [start + 1, start + 2],
              text: 'Y'
            })
          });
        }
      }
    });

    const result = handleFixMode('abc', [{ rule: ruleA }, { rule: ruleB }]);
    // ruleA applied, ruleB's fix was dropped (conflict)
    expect(result.fixedResult.result).toBe('X');
    expect(result.fixedResult.result).not.toContain('Y');
    // Loop completed in 2 rounds: round 1 applied A, round 2 found no fixes
    expect(result.lintResult.ruleManager.getReportData().length).toBe(2);
  });

  test('text unchanged (all fixes conflict) — exits loop', () => {
    // Both rules target the exact same range [0, 3)
    // Rule A: [0, 3) → "X"
    // Rule B: [0, 3) → "Y"
    // Sort by range[0], both are 0. Rule A comes first (stable sort), B conflicts.
    // applyFix: A applied, B in notAppliedFixes.
    // Next round: text is "X", neither rule matches → no fixes → exit.
    const ruleA = makeRule({
      name: 'replace-to-x',
      selector: 'text',
      reportFn: (ctx, node) => {
        if (node.value === 'abc') {
          ctx.report({
            loc: node.position,
            message: 'to X',
            fix: () => ({
              range: [node.position.start.offset, node.position.end.offset],
              text: 'X'
            })
          });
        }
      }
    });

    const ruleB = makeRule({
      name: 'replace-to-y',
      selector: 'text',
      reportFn: (ctx, node) => {
        if (node.value === 'abc') {
          ctx.report({
            loc: node.position,
            message: 'to Y',
            fix: () => ({
              range: [node.position.start.offset, node.position.end.offset],
              text: 'Y'
            })
          });
        }
      }
    });

    const result = handleFixMode('abc', [{ rule: ruleA }, { rule: ruleB }]);
    expect(result.fixedResult.result).toBe('X');
  });

  test('does not exceed MAX_LINT_AND_FIX_CALL_TIMES', () => {
    // Rule that doubles "a" → "aa" → "aaaa" → ... each round.
    // Text always changes, always produces a violation → loop would be infinite without the guard.
    let callCount = 0;
    const rule = makeRule({
      name: 'double-a',
      selector: 'text',
      reportFn: (ctx, node) => {
        if (node.value === 'a'.repeat(Math.pow(2, callCount))) {
          callCount++;
          ctx.report({
            loc: node.position,
            message: 'double it',
            fix: () => ({
              range: [node.position.start.offset, node.position.end.offset],
              text: node.value + node.value // a → aa → aaaa → ...
            })
          });
        }
      }
    });

    const result = handleFixMode('a', [{ rule }]);
    // Should hit MAX guard, not exit early
    expect(callCount).toBe(MAX_LINT_AND_FIX_CALL_TIMES);
    expect(result.fixedResult.result).toBe('a'.repeat(Math.pow(2, MAX_LINT_AND_FIX_CALL_TIMES)));
  });

  test('initialLintResult reflects first round', () => {
    const rule = makeRule({
      name: 'replace-foo',
      selector: 'text',
      reportFn: (ctx, node) => {
        if (node.value === 'foo') {
          ctx.report({
            loc: node.position,
            message: 'replace foo',
            fix: () => ({
              range: [node.position.start.offset, node.position.end.offset],
              text: 'bar'
            })
          });
        }
      }
    });

    const result = handleFixMode('foo', [{ rule }]);
    // initialLintResult is from first round — should have 1 report
    expect(result.lintResult.ruleManager.getReportData().length).toBe(1);
    expect(result.lintResult.ruleManager.getReportData()[0].message).toBe('replace foo');
  });

  test('notAppliedFixes reflects only last round, not historical', () => {
    // Round 1: ruleA replaces "abc"→"X", ruleB replaces "abc"→"Y" (conflict, B skipped)
    // Round 2: text is "X", ruleC replaces "X"→"Z" (applied cleanly, no conflict)
    // If accumulated: notAppliedFixes would contain stale B fix (wrong)
    // If last-round only: notAppliedFixes is [] (correct — round 2 had no conflict)
    const ruleA = makeRule({
      name: 'a',
      selector: 'text',
      reportFn: (ctx, node) => {
        if (node.value === 'abc') {
          ctx.report({
            loc: node.position,
            message: 'a',
            fix: () => ({
              range: [node.position.start.offset, node.position.end.offset],
              text: 'X'
            })
          });
        }
      }
    });

    const ruleB = makeRule({
      name: 'b',
      selector: 'text',
      reportFn: (ctx, node) => {
        if (node.value === 'abc') {
          ctx.report({
            loc: node.position,
            message: 'b',
            fix: () => ({
              range: [node.position.start.offset, node.position.end.offset],
              text: 'Y'
            })
          });
        }
      }
    });

    const ruleC = makeRule({
      name: 'c',
      selector: 'text',
      reportFn: (ctx, node) => {
        if (node.value === 'X') {
          ctx.report({
            loc: node.position,
            message: 'c',
            fix: () => ({
              range: [node.position.start.offset, node.position.end.offset],
              text: 'Z'
            })
          });
        }
      }
    });

    const result = handleFixMode('abc', [{ rule: ruleA }, { rule: ruleB }, { rule: ruleC }]);
    // Final text: "Z" (round 1: abc→X, round 2: X→Z)
    expect(result.fixedResult.result).toBe('Z');
    // Round 2 had no conflict → notAppliedFixes should be empty
    // NOT: [ruleB's stale fix from round 1]
    expect(result.fixedResult.notAppliedFixes).toStrictEqual([]);
  });

  test('notAppliedFixes from last round when text converges with conflicts', () => {
    // Round 1: "abc" → ruleA wins "abc"→"X", ruleB conflict skipped
    // Round 2: "X" → ruleA wins "X"→"W", ruleB conflict skipped
    // Round 3: "W" → no fixes → exit
    // lastNotAppliedFixes should be round 2's [ruleB fix], not accumulated [ruleB, ruleB]
    const ruleA = makeRule({
      name: 'a',
      selector: 'text',
      reportFn: (ctx, node) => {
        if (node.value === 'abc' || node.value === 'X') {
          ctx.report({
            loc: node.position,
            message: 'a',
            fix: () => ({
              range: [node.position.start.offset, node.position.end.offset],
              text: node.value === 'abc' ? 'X' : 'W'
            })
          });
        }
      }
    });

    const ruleB = makeRule({
      name: 'b',
      selector: 'text',
      reportFn: (ctx, node) => {
        if (node.value === 'abc' || node.value === 'X') {
          ctx.report({
            loc: node.position,
            message: 'b',
            fix: () => ({
              range: [node.position.start.offset, node.position.end.offset],
              text: 'Y'
            })
          });
        }
      }
    });

    const result = handleFixMode('abc', [{ rule: ruleA }, { rule: ruleB }]);
    expect(result.fixedResult.result).toBe('W');
    // last round (round 2) had a conflict → 1 entry
    expect(result.fixedResult.notAppliedFixes.length).toBe(1);
    expect(result.fixedResult.notAppliedFixes[0].text).toBe('Y');
  });

  test('A -> B -> A oscillation: stops after 2 rounds, returns applied A', () => {
    // Round 1: "A" -> ruleA "A"->"B"
    // Round 2: "B" -> ruleB "B"->"A"
    // After round 2 applies the fix (B -> A), current becomes "A" which was already
    // seen in round 1 => CYCLE_DETECTED, break. Returns the A applied in round 2,
    // NOT the round-1 B.
    const ruleA = makeRule({
      name: 'a-to-b',
      selector: 'text',
      reportFn: (ctx, node) => {
        if (node.value === 'A') {
          ctx.report({
            loc: node.position,
            message: 'A to B',
            fix: () => ({ range: [node.position.start.offset, node.position.end.offset], text: 'B' })
          });
        }
      }
    });

    const ruleB = makeRule({
      name: 'b-to-a',
      selector: 'text',
      reportFn: (ctx, node) => {
        if (node.value === 'B') {
          ctx.report({
            loc: node.position,
            message: 'B to A',
            fix: () => ({ range: [node.position.start.offset, node.position.end.offset], text: 'A' })
          });
        }
      }
    });

    const result = handleFixMode('A', [{ rule: ruleA }, { rule: ruleB }]);
    expect(result.fixedResult.result).toBe('A');
    expect(result.fixedResult.rounds).toBe(2);
    expect(result.fixedResult.convergence).toBe(FixConvergence.CYCLE_DETECTED);
  });

  test('stable cascade ends STABLE with one extra no-fix round', () => {
    // Round 1: 'aa' -> 'cc' (ruleA then ruleB); Round 2: 'cc' -> no fixes => STABLE
    const ruleA = makeRule({
      name: 'a-aa-to-bb',
      selector: 'text',
      reportFn: (ctx, node) => {
        if (node.value === 'aa') {
          ctx.report({ loc: node.position, message: 'aa', fix: () => ({ range: [node.position.start.offset, node.position.end.offset], text: 'bb' }) });
        }
      }
    });
    const ruleB = makeRule({
      name: 'b-bb-to-cc',
      selector: 'text',
      reportFn: (ctx, node) => {
        if (node.value === 'bb') {
          ctx.report({ loc: node.position, message: 'bb', fix: () => ({ range: [node.position.start.offset, node.position.end.offset], text: 'cc' }) });
        }
      }
    });

    const result = handleFixMode('aa', [{ rule: ruleA }, { rule: ruleB }]);
    expect(result.fixedResult.result).toBe('cc');
    expect(result.fixedResult.convergence).toBe(FixConvergence.STABLE);
    // round1: aa->bb, round2: bb->cc, round3: no-fix check => 3 rounds
    expect(result.fixedResult.rounds).toBe(3);
  });

  test('text unchanged with conflict is STABLE via result===current branch', () => {
    // ruleA replaces 'abc' -> 'abc' (text unchanged), ruleB 'abc' -> 'Y' conflicts with it.
    // After applyFix, text stays 'abc' => STABLE on the FIRST round (result === current).
    const ruleA = makeRule({
      name: 'same',
      selector: 'text',
      reportFn: (ctx, node) => {
        if (node.value === 'abc') {
          ctx.report({ loc: node.position, message: 'same', fix: () => ({ range: [node.position.start.offset, node.position.end.offset], text: 'abc' }) });
        }
      }
    });
    const ruleB = makeRule({
      name: 'to-y',
      selector: 'text',
      reportFn: (ctx, node) => {
        if (node.value === 'abc') {
          ctx.report({ loc: node.position, message: 'y', fix: () => ({ range: [node.position.start.offset, node.position.end.offset], text: 'Y' }) });
        }
      }
    });

    const result = handleFixMode('abc', [{ rule: ruleA }, { rule: ruleB }]);
    expect(result.fixedResult.result).toBe('abc');
    expect(result.fixedResult.convergence).toBe(FixConvergence.STABLE);
    expect(result.fixedResult.rounds).toBe(1);
    // ruleB's fix was dropped (conflict), still reported in last round
    expect(result.fixedResult.notAppliedFixes.length).toBe(1);
    expect(result.fixedResult.notAppliedFixes[0].text).toBe('Y');
  });

  test('cycle of length MAX is detected, not mislabeled MAX_ROUNDS', () => {
    // S0 -> S1 -> ... -> S9 -> S0, where S_i is the string i repeated.
    // After the 10th round, current returns to S0 which was already seen,
    // so it must be CYCLE_DETECTED (not MAX_ROUNDS / rounds 10 truncation).
    const states = Array.from({ length: MAX_LINT_AND_FIX_CALL_TIMES }, (_, i) => String(i).repeat(3));
    const rules = states.map((state, i) => {
      const next = states[(i + 1) % states.length];
      return makeRule({
        name: `s${i}-to-s${(i + 1) % states.length}`,
        selector: 'text',
        reportFn: (ctx, node) => {
          if (node.value === state) {
            ctx.report({ loc: node.position, message: 'step', fix: () => ({ range: [node.position.start.offset, node.position.end.offset], text: next }) });
          }
        }
      });
    });

    const result = handleFixMode(states[0], rules.map((rule) => ({ rule })));
    expect(result.fixedResult.rounds).toBe(MAX_LINT_AND_FIX_CALL_TIMES);
    expect(result.fixedResult.convergence).toBe(FixConvergence.CYCLE_DETECTED);
  });

  test('monotonic growth hits MAX_ROUNDS at 10, not mis-detected as cycle', () => {
    let callCount = 0;
    const rule = makeRule({
      name: 'double-a',
      selector: 'text',
      reportFn: (ctx, node) => {
        if (node.value === 'a'.repeat(Math.pow(2, callCount))) {
          callCount++;
          ctx.report({ loc: node.position, message: 'double', fix: () => ({ range: [node.position.start.offset, node.position.end.offset], text: node.value + node.value }) });
        }
      }
    });

    const result = handleFixMode('a', [{ rule }]);
    expect(callCount).toBe(MAX_LINT_AND_FIX_CALL_TIMES);
    expect(result.fixedResult.rounds).toBe(MAX_LINT_AND_FIX_CALL_TIMES);
    expect(result.fixedResult.convergence).toBe(FixConvergence.MAX_ROUNDS);
  });

  test('no fixes => STABLE with rounds === 1', () => {
    const rule = makeRule({ name: 'no-op', selector: 'text', reportFn: () => {} });
    const result = handleFixMode('hello world', [{ rule }]);
    expect(result.fixedResult.convergence).toBe(FixConvergence.STABLE);
    expect(result.fixedResult.rounds).toBe(1);
  });

  test('metrics records rounds and per-round wall times', () => {
    const rule = makeRule({
      name: 'replace-foo',
      selector: 'text',
      reportFn: (ctx, node) => {
        if (node.value === 'foo') {
          ctx.report({ loc: node.position, message: 'foo', fix: () => ({ range: [node.position.start.offset, node.position.end.offset], text: 'bar' }) });
        }
      }
    });

    const result = handleFixMode('foo', [{ rule }]);
    expect(result.fixedResult.metrics).toBeDefined();
    expect(result.fixedResult.metrics!.rounds).toBe(result.fixedResult.rounds);
    expect(result.fixedResult.metrics!.perRound).toHaveLength(result.fixedResult.rounds);
  });

});
