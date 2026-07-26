import type { LintMdRule, LintMdRuleContext, LintSourceCode, ReportOption } from '../../src/types';
import { lintMarkdownInternal } from '../../src/core/lint-markdown';
import { runLint } from '../../src/core/run-lint';

describe('LintSourceCode', () => {
  test('exposes sourceCode on rule context', () => {
    const rule: LintMdRule = {
      meta: { name: 'source-code-test' },
      create: context => {
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
        text: node => {
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
      create: context => {
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
      create: context => {
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
    const rule: LintMdRule = {
      meta: { name: 'entity-range-test' },
      create: (context: LintMdRuleContext) => ({
        text: node => {
          if (node.type === 'text') {
            const ampIndex = node.value.indexOf('&');
            if (ampIndex === -1) return;
            const range = context.sourceCode.getTextRange(node, ampIndex, ampIndex + 1);
            // complete &#40; must be [2, 7] (6-char entity + preceding Chinese)
            expect(range).toStrictEqual([2, 7]);
          }
        }
      })
    };
    runLint('中文&#40;', [{ rule }]);
  });

  test('context still exposes legacy ast and markdown fields', () => {
    const rule: LintMdRule = {
      meta: { name: 'legacy-fields-test' },
      create: context => {
        expect(context.markdown).toBe('中文');
        expect(context.ast.type).toBe('root');
        expect(context.options).toEqual({});
        expect(typeof context.report).toBe('function');
        return {};
      }
    };
    runLint('中文', [{ rule }]);
  });
});
