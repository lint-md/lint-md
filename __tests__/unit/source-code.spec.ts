import type { LintMdRule, LintMdRuleContext, LintSourceCode } from '../../src/types';
import { lintMarkdownInternal } from '../../src/core/lint-markdown';
import { runLint } from '../../src/core/run-lint';
import { createLintSourceCode } from '../../src/utils/source-code';

describe('LintSourceCode', () => {
  test('exposes sourceCode on rule context', () => {
    const rule: LintMdRule = {
      meta: { name: 'source-code-test' },
      create: (context) => {
        expect(context.sourceCode).toBeDefined();
        expect(context.sourceCode.text).toBe('中文');
        expect(context.sourceCode.ast).toBe(context.ast);
        return {};
      }
    };

    runLint('中文', [{ rule }]);
  });

  test('allows rules to fix a complete character reference', () => {
    const rule: LintMdRule = {
      meta: { name: 'source-code-range-test' },
      create: (context: LintMdRuleContext) => ({
        text: (node) => {
          if (node.type === 'text') {
            const index = node.value.indexOf('(');
            if (index === -1) {
              return;
            }
            const range = context.sourceCode.getTextRange(node, index, index + 1);
            context.report({
              loc: node.position,
              message: 'replace parenthesis',
              fix: fixer => fixer.replaceTextRange(range, '（')
            });
          }
        }
      })
    };

    const result = lintMarkdownInternal('中文&#40;test', [{ rule }], true);
    expect(result.fixedResult?.result).toBe('中文（test');
  });

  test('all rules share the same SourceCode instance', () => {
    const instances: LintSourceCode[] = [];

    const makeRule = (name: string): LintMdRule => ({
      meta: { name },
      create: (context) => {
        instances.push(context.sourceCode);
        return {};
      }
    });

    runLint('中文', [{ rule: makeRule('a') }, { rule: makeRule('b') }]);
    expect(instances).toHaveLength(2);
    expect(instances[0]).toBe(instances[1]);
  });

  test('getRaw returns original Markdown for a node', () => {
    let capturedContext: LintMdRuleContext | undefined;
    const rule: LintMdRule = {
      meta: { name: 'getraw-test' },
      create: (context) => {
        capturedContext = context;
        return {};
      }
    };

    runLint('**bold**', [{ rule }]);
    const sourceCode = capturedContext!.sourceCode;
    const raw = sourceCode.getRaw(sourceCode.ast);
    expect(raw).toBe('**bold**');
  });

  test('getTextRange maps entity to complete source range', () => {
    expect.assertions(2);

    const rule: LintMdRule = {
      meta: { name: 'entity-range-test' },
      create: (context: LintMdRuleContext) => ({
        text: (node) => {
          if (node.type !== 'text') {
            return;
          }

          const index = node.value.indexOf('(');
          expect(index).toBe(2);

          const range = context.sourceCode.getTextRange(node, index, index + 1);
          // &#40; is 5 source characters spanning [2, 7)
          expect(range).toStrictEqual([2, 7]);
        }
      })
    };
    runLint('中文&#40;', [{ rule }]);
  });

  test('context still exposes legacy ast and markdown fields', () => {
    const rule: LintMdRule = {
      meta: { name: 'legacy-fields-test' },
      create: (context) => {
        expect(context.markdown).toBe('中文');
        expect(context.ast.type).toBe('root');
        expect(context.options).toEqual({});
        expect(typeof context.report).toBe('function');
        return {};
      }
    };
    runLint('中文', [{ rule }]);
  });

  describe('getPosition', () => {
    const sc = createLintSourceCode({
      text: 'line1\nline2\r\nline3\n',
      ast: {} as any,
      sourceMap: {} as any
    });

    test('first line first character', () => {
      expect(sc.getPosition(0)).toEqual({ line: 1, column: 1, offset: 0 });
    });

    test('start of second line (LF)', () => {
      const lfOffset = 'line1\n'.length;
      expect(sc.getPosition(lfOffset)).toEqual({ line: 2, column: 1, offset: lfOffset });
    });

    test('start of third line (CRLF)', () => {
      const crlfOffset = 'line1\nline2\r\n'.length;
      expect(sc.getPosition(crlfOffset)).toEqual({ line: 3, column: 1, offset: crlfOffset });
    });

    test('supports standalone CR line endings', () => {
      const sc2 = createLintSourceCode({
        text: 'a\rb',
        ast: {} as any,
        sourceMap: {} as any
      });
      expect(sc2.getPosition(2)).toEqual({ line: 2, column: 1, offset: 2 });
    });

    test('columns use UTF-16 code-unit offsets', () => {
      const sc2 = createLintSourceCode({
        text: 'a😀b',
        ast: {} as any,
        sourceMap: {} as any
      });
      expect(sc2.getPosition(3)).toEqual({ line: 1, column: 4, offset: 3 });
    });

    test('end of document', () => {
      const len = 'line1\nline2\r\nline3\n'.length;
      expect(sc.getPosition(len)).toEqual({ line: 4, column: 1, offset: len });
    });

    test('offset equals text length returns position at end', () => {
      const sc2 = createLintSourceCode({
        text: '\n',
        ast: {} as any,
        sourceMap: {} as any
      });
      expect(sc2.getPosition(1)).toEqual({ line: 2, column: 1, offset: 1 });
    });

    test('throws on negative offset', () => {
      expect(() => sc.getPosition(-1)).toThrow(RangeError);
    });

    test('throws on non-integer offset', () => {
      expect(() => sc.getPosition(1.5)).toThrow(RangeError);
      expect(() => sc.getPosition(NaN)).toThrow(RangeError);
    });

    test('throws on offset beyond text length', () => {
      expect(() => sc.getPosition(100)).toThrow(RangeError);
    });
  });

  describe('getLocation', () => {
    const sc = createLintSourceCode({
      text: 'ab\ncd\r\nef\n',
      ast: {} as any,
      sourceMap: {} as any
    });

    test('single-line range', () => {
      const result = sc.getLocation([0, 2]);
      expect(result.start).toEqual({ line: 1, column: 1, offset: 0 });
      expect(result.end).toEqual({ line: 1, column: 3, offset: 2 });
    });

    test('cross-line range', () => {
      const result = sc.getLocation([0, 5]);
      expect(result.start).toEqual({ line: 1, column: 1, offset: 0 });
      expect(result.end).toEqual({ line: 2, column: 3, offset: 5 });
    });

    test('empty range (start === end)', () => {
      const result = sc.getLocation([3, 3]);
      expect(result.start).toEqual(result.end);
      expect(result.start.offset).toBe(3);
    });

    test('throws on end < start', () => {
      expect(() => sc.getLocation([5, 0])).toThrow(RangeError);
    });

    test('throws on negative start', () => {
      expect(() => sc.getLocation([-1, 1])).toThrow(RangeError);
    });

    test('throws on non-integer range element', () => {
      expect(() => sc.getLocation([0, 1.5])).toThrow(RangeError);
    });

    test('throws on range beyond text length', () => {
      expect(() => sc.getLocation([0, 100])).toThrow(RangeError);
    });
  });
});
