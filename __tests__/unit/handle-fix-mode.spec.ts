import { handleFixMode } from '../../src/core/handle-fix-mode';
import { MAX_LINT_AND_FIX_CALL_TIMES } from '../../src/common/constant';
import type { LintMdRule } from '../../src/types';
import { FixConvergence } from '../../src/types';

describe('handleFixMode', () => {
  test('connects the production round adapter to the fix loop', () => {
    const rule: LintMdRule = {
      meta: { name: 'replace-foo' },
      create: context => ({
        text: (node) => {
          if (node.type !== 'text' || node.value !== 'foo') {
            return;
          }

          context.report({
            loc: node.position,
            message: 'replace foo',
            fix: () => ({
              range: [node.position.start.offset, node.position.end.offset],
              text: 'bar'
            })
          });
        }
      })
    };

    const result = handleFixMode('foo', [{ rule }]);

    expect(result.lintResult.reports).toHaveLength(1);
    expect(result.fixedResult.result).toBe('bar');
    expect(result.fixedResult.convergence).toBe(FixConvergence.STABLE);
    expect(result.fixedResult.rounds).toBe(2);
  });

  test('returns stable output when production rules report no fixes', () => {
    const rule: LintMdRule = {
      meta: { name: 'no-fix' },
      create: () => ({ text: () => {} })
    };

    const result = handleFixMode('hello', [{ rule }]);

    expect(result.fixedResult.result).toBe('hello');
    expect(result.fixedResult.notAppliedFixes).toStrictEqual([]);
    expect(result.fixedResult.convergence).toBe(FixConvergence.STABLE);
    expect(result.fixedResult.rounds).toBe(1);
  });

  test('uses the production round limit', () => {
    const rule: LintMdRule = {
      meta: { name: 'append-a' },
      create: context => ({
        text: (node) => {
          if (node.type !== 'text') {
            return;
          }

          context.report({
            loc: node.position,
            message: 'append a',
            fix: () => ({
              range: [node.position.start.offset, node.position.end.offset],
              text: `${node.value}a`
            })
          });
        }
      })
    };

    const result = handleFixMode('a', [{ rule }]);

    expect(result.fixedResult.rounds).toBe(MAX_LINT_AND_FIX_CALL_TIMES);
    expect(result.fixedResult.convergence).toBe(FixConvergence.MAX_ROUNDS);
  });
});
