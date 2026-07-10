import { handleFixMode } from '../../src/core/handle-fix-mode';
import { MAX_LINT_AND_FIX_CALL_TIMES } from '../../src/common/constant';
import type { LintMdRule, LintMdRuleContext, FixConfig } from '../../src/types';

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
});
