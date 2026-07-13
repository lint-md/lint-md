import { createRuleErrorCollector, RuleExecutionFailure, normalizeErrorMessage } from '../../src/utils/rule-execution-errors';
import { runLint } from '../../src/core/run-lint';
import { handleFixMode } from '../../src/core/handle-fix-mode';
import type { LintMdRule } from '../../src/types';

const makeThrowingRule = (name: string, fn: () => void): LintMdRule => ({
  meta: { name },
  create: () => ({ text: fn })
});

// 一个 selector 正常 report 一个 fix 的规则（fix 回调抛错可控）。fix() 仅在 getAllFixes() 时执行。
const makeFixRule = (
  name: string,
  fixImpl: () => { range: number[]; text: string }
): LintMdRule => ({
  meta: { name },
  create: (context) => ({
    text: (node: any) => {
      context.report({
        loc: node.position,
        message: 'needs fix',
        fix: () => fixImpl()
      });
    }
  })
});

describe('rule-execution-errors', () => {
  test('normalizeErrorMessage: Error / non-Error values become safe messages', () => {
    expect(normalizeErrorMessage(new Error('boom'))).toBe('boom');
    expect(normalizeErrorMessage('plain')).toBe('plain');
    expect(normalizeErrorMessage(42)).toBe('42');
    // Object.create(null) 无法被 String() 转换；collect 模式仍必须保持可观测、不中断。
    expect(normalizeErrorMessage(Object.create(null))).toBe('[unprintable thrown value]');

    const prototypeThrowingProxy = new Proxy({}, {
      getPrototypeOf: () => { throw new Error('prototype trap'); }
    });
    expect(normalizeErrorMessage(prototypeThrowingProxy)).toBe('[unprintable thrown value]');

    const messageThrowingError = new Error('ignored');
    Object.defineProperty(messageThrowingError, 'message', {
      get: () => { throw new Error('message getter'); }
    });
    expect(normalizeErrorMessage(messageThrowingError)).toBe('[unprintable thrown value]');
  });

  test('collect policy accumulates multiple rule failures with round/phase', () => {
    const c = createRuleErrorCollector('collect', 2);
    c.collect('r1', 'selector', new Error('e1'), 'text');
    c.collect('r2', 'create', 'e2');
    const errs = c.getErrors();
    expect(errs).toHaveLength(2);
    expect(errs[0]).toMatchObject({ ruleName: 'r1', nodeType: 'text', message: 'e1', round: 2, phase: 'selector' });
    expect(errs[1]).toMatchObject({ ruleName: 'r2', message: 'e2', round: 2, phase: 'create' });
  });

  test('getErrors returns a snapshot rather than a later-mutated collector array', () => {
    const c = createRuleErrorCollector('collect', 0);
    c.collect('r1', 'create', 'first');
    const snapshot = c.getErrors();
    c.collect('r2', 'create', 'second');

    expect(snapshot).toHaveLength(1);
    expect(c.getErrors()).toHaveLength(2);
  });

  test('strict policy throws RuleExecutionFailure carrying normalized error', () => {
    const c = createRuleErrorCollector('strict', 0);
    expect(() => c.collect('r', 'selector', new Error('x'), 'code'))
      .toThrow(RuleExecutionFailure);
    try {
      c.collect('r', 'selector', 'non-error', 'code');
    }
    catch (e) {
      expect(e).toBeInstanceOf(RuleExecutionFailure);
      expect((e as RuleExecutionFailure).error.message).toBe('non-error');
    }
  });

  test('lint-only: collect returns executionErrors, does not throw, no console.error', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    const rule = makeThrowingRule('t', () => { throw new Error('fail'); });
    const { executionErrors } = runLint('hello world', [{ rule }]);
    expect(spy).not.toHaveBeenCalled();
    expect(executionErrors).toHaveLength(1);
    expect(executionErrors[0].ruleName).toBe('t');
    expect(executionErrors[0].round).toBe(0);
    expect(executionErrors[0].phase).toBe('selector');
    spy.mockRestore();
  });

  test('lint-only: two rules on SAME text event — bad rule does not block the other', () => {
    // 两个规则都监听 text：第一个抛错，第二个正常 report，验证按 listener 捕获的核心目的。
    let goodReported = false;
    const bad: LintMdRule = makeThrowingRule('bad-text', () => { throw new Error('bad'); });
    const good: LintMdRule = {
      meta: { name: 'good-text' },
      create: (context) => ({
        text: (node: any) => {
          context.report({ loc: node.position, message: 'ok' });
          goodReported = true;
        }
      })
    };
    const { ruleManager, executionErrors } = runLint('hello world', [{ rule: bad }, { rule: good }]);
    expect(goodReported).toBe(true);
    expect(ruleManager.getReportData().some(d => d.name === 'good-text')).toBe(true);
    expect(executionErrors).toHaveLength(1);
    expect(executionErrors[0]).toMatchObject({ ruleName: 'bad-text', phase: 'selector' });
  });

  test('collect: manager wired with collector — fix() throwing is collected with phase=fix', () => {
    // fix() 只在 getAllFixes() 时执行；验证 runLint 已将 collector 传给 ruleManager（P1 修复点）。
    const rule = makeFixRule('fix-throw', () => { throw new Error('fix failed'); });
    const { ruleManager } = runLint('single', [{ rule }]);
    const fixes = ruleManager.getAllFixes();
    expect(fixes).toEqual([]); // 抛错不产生 fix
    const errs = ruleManager.getExecutionErrors();
    expect(errs).toHaveLength(1);
    expect(errs[0]).toMatchObject({ ruleName: 'fix-throw', phase: 'fix', round: 0, message: 'fix failed' });
  });

  test('strict: manager wired with collector — fix() throwing throws RuleExecutionFailure', () => {
    const rule = makeFixRule('fix-strict', () => { throw new Error('fix failed'); });
    const { ruleManager } = runLint('single', [{ rule }], { ruleErrorPolicy: 'strict' });
    let thrown: unknown;
    try {
      ruleManager.getAllFixes();
    }
    catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(RuleExecutionFailure);
    expect((thrown as RuleExecutionFailure).error).toMatchObject({ ruleName: 'fix-strict', phase: 'fix' });
  });

  test('fix-mode: fix() error aggregated into executionErrors with phase=fix, not rethrown', () => {
    const rule = makeFixRule('fix-throw', () => { throw new Error('fix failed'); });
    const result = handleFixMode('single', [{ rule }]); // 单文本节点，避免重复报告
    const fixErrs = result.executionErrors.filter(e => e.phase === 'fix');
    expect(fixErrs).toHaveLength(1);
    expect(fixErrs[0]).toMatchObject({ ruleName: 'fix-throw', phase: 'fix', round: 0, message: 'fix failed' });
  });

  test('fix-mode: aggregates errors across multiple fix rounds (selector r0 + fix r1)', () => {
    // 单文本节点 'single'，确保每轮只产生一条报告。
    let aCalls = 0;
    const selectorRule: LintMdRule = {
      meta: { name: 'A' },
      create: () => ({
        text: () => {
          aCalls++;
          if (aCalls === 1) {
            throw new Error('selector round0'); // 仅第 0 轮抛 selector 错
          }
        }
      })
    };
    let bFixCalls = 0;
    const fixRule: LintMdRule = {
      meta: { name: 'B' },
      create: (context) => ({
        text: (node: any) => {
          context.report({
            loc: node.position,
            message: 'needs fix',
            fix: () => {
              bFixCalls++;
              if (bFixCalls === 1) {
                // 第 0 轮 fix 成功，文本变化 -> 进入第 1 轮
                return { range: [0, node.position.end.offset], text: 'changed' };
              }
              throw new Error('fix round1'); // 第 1 轮 fix 抛错
            }
          });
        }
      })
    };
    const result = handleFixMode('single', [{ rule: selectorRule }, { rule: fixRule }]);
    expect(result.executionErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleName: 'A', phase: 'selector', round: 0 }),
        expect.objectContaining({ ruleName: 'B', phase: 'fix', round: 1 })
      ])
    );
  });

  test('fix-mode strict: first rule failure (selector or fix) throws RuleExecutionFailure', () => {
    const rule = makeFixRule('fix-strict', () => { throw new Error('boom'); });
    expect(() => handleFixMode('single', [{ rule }], 'strict'))
      .toThrow(RuleExecutionFailure);
  });
});
