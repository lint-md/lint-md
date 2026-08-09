import {
  SourceMapConsistencyError,
  parseMdWithSourceMap
} from '@lint-md/parser';
import { runLint } from '../../src/core/run-lint';
import { lintMarkdownInternal } from '../../src/core/lint-markdown';
import { TextScanner } from '../../src/utils/text-scanner';
import { createLintSourceCode } from '../../src/utils/source-code';
import noHalfWidthPunctuation from '../../src/rules/no-half-width-punctuation';
import type { LintMdRule } from '../../src/types';

const halfWidthConfig = [{ rule: noHalfWidthPunctuation }];

describe('parser source-map integration', () => {
  test('does not resolve source ranges for uninspected code points', () => {
    const node = {
      type: 'text',
      value: 'abc',
      position: {
        start: { line: 1, column: 1, offset: 0 },
        end: { line: 1, column: 4, offset: 3 }
      }
    };
    const getTextRange = jest.fn((_node: unknown, start: number, end: number) => [start, end] as [number, number]);
    const getLocation = jest.fn((range: [number, number]) => ({
      start: { line: 1, column: range[0] + 1, offset: range[0] },
      end: { line: 1, column: range[1] + 1, offset: range[1] }
    }));
    const sourceCode = {
      text: 'abc',
      ast: { type: 'root', children: [] } as any,
      getRaw: () => '',
      getTextRange,
      getPosition: () => ({ line: 1, column: 1, offset: 0 }),
      getLocation
    };

    new TextScanner(node as any, sourceCode).forEachChar(() => {});
    expect(getTextRange).not.toHaveBeenCalled();
    expect(getLocation).not.toHaveBeenCalled();

    const positions: Array<{ endOffset: number }> = [];
    new TextScanner(node as any, sourceCode).forEachChar((_char, _index, pos) => {
      positions.push(pos);
    });
    expect(getTextRange).not.toHaveBeenCalled();
    expect(getLocation).not.toHaveBeenCalled();
    expect(positions.map(pos => pos.endOffset)).toEqual([1, 2, 3]);
    expect(getTextRange).toHaveBeenCalledTimes(3);
    expect(getLocation).toHaveBeenCalledTimes(3);
    expect(getTextRange.mock.calls.map(([, start, end]) => [start, end]))
      .toEqual([[0, 1], [1, 2], [2, 3]]);
  });

  test.each([
    ['padding normalization', '` a `', 'a', [2, 3]],
    ['multiple backtick delimiters', '`` `value` ``', '`value`', [3, 10]]
  ])('%s resolves inlineCode ranges with the parser source map', (_name, markdown, value, expectedRange) => {
    const { ast, sourceMap } = parseMdWithSourceMap(markdown);
    const sourceCode = createLintSourceCode({ text: markdown, ast, sourceMap });
    const inlineCode = (ast.children[0] as any).children[0];

    expect(inlineCode).toMatchObject({ type: 'inlineCode', value });
    expect(new TextScanner(inlineCode, sourceCode).matchAt(0, value.length).absoluteRange)
      .toEqual(expectedRange);
  });

  test('runLint resolves an inlineCode selector fix through the source map', () => {
    const inlineCodeRule: LintMdRule = {
      meta: { name: 'inline-code-source-map' },
      create: context => ({
        inlineCode: (node) => {
          const match = new TextScanner(node as any, context.sourceCode).matchAt(0, 1);
          context.report({
            loc: match.loc,
            message: 'replace inline code value',
            fix: fixer => fixer.replaceTextRange(match.absoluteRange, 'b')
          });
        }
      })
    };

    const result = lintMarkdownInternal('` a `', [{ rule: inlineCodeRule }], true);
    const [report] = result.lintResult.reports;

    expect(report.loc).toMatchObject({
      start: { offset: 2 },
      end: { offset: 3 }
    });
    expect(result.fixedResult?.result).toBe('` b `');
  });

  test.each([
    ['escaped', '中文\\(test\\)中文', '中文（test）中文'],
    ['numeric entity', '中文&#40;test&#41;中文', '中文（test）中文']
  ])('%s fixes the complete source construct and converges', (_name, input, expected) => {
    const first = lintMarkdownInternal(input, halfWidthConfig, true);
    expect(first.fixedResult?.result).toBe(expected);

    const second = lintMarkdownInternal(first.fixedResult!.result, halfWidthConfig, false);
    expect(second.lintResult.reports).toHaveLength(0);
  });

  test.each([
    [
      'blockquote continuations',
      ['> 中文(test)', '> 中文(test)'].join('\n'),
      ['> 中文（test）', '> 中文（test）'].join('\n')
    ],
    [
      'list continuation indentation',
      ['- 中文(test)', '  中文(test)'].join('\n'),
      ['- 中文（test）', '  中文（test）'].join('\n')
    ]
  ])('%s preserves container syntax while fixing mapped punctuation', (_name, input, expected) => {
    const result = lintMarkdownInternal(input, halfWidthConfig, true);

    expect(result.fixedResult?.result).toBe(expected);
  });

  test('diagnostic offsets and fix ranges are resolved by the same source-map range', () => {
    const input = '中文&#40;test&#41;中文';
    const { reports, fixes } = runLint(input, halfWidthConfig, { computeFixes: true });

    expect(reports).toHaveLength(2);
    expect(fixes).toHaveLength(2);
    for (let i = 0; i < reports.length; i++) {
      expect(reports[i].loc.start.offset).toBe(fixes[i].range[0]);
      expect(reports[i].loc.end.offset).toBe(fixes[i].range[1]);
    }
  });

  test.each([
    ['CR', '\r', 4],
    ['CRLF', '\r\n', 5],
    ['LF', '\n', 4]
  ])('%s uses parser line/column positions and raw fix offsets', (_name, newline, expectedOffset) => {
    const input = `a${newline}中文(test)中文`;
    const { reports, fixes } = runLint(input, halfWidthConfig, { computeFixes: true });
    const [report] = reports;
    const [fix] = fixes;

    expect(report.loc.start).toMatchObject({ line: 2, column: 3, offset: expectedOffset });
    expect(fix.range).toEqual([report.loc.start.offset, report.loc.end.offset]);
  });

  test('an entity decoded to two UTF-16 units is scanned and fixed once as an atomic source range', () => {
    const atomicRule: LintMdRule = {
      meta: { name: 'atomic-entity' },
      create: context => ({
        text: (node) => {
          const scanner = new TextScanner(node as any, context.sourceCode);
          scanner.forEachChar((char, index) => {
            if (char === '𝔄') {
              const match = scanner.matchAt(index, char.length);
              context.report({
                loc: match.loc,
                message: 'replace atomic entity',
                fix: fixer => fixer.replaceTextRange(match.absoluteRange, 'A')
              });
            }
          });
        }
      })
    };
    const result = lintMarkdownInternal('中文&Afr;中文', [{ rule: atomicRule }], true);
    expect(result.lintResult.reports).toHaveLength(1);
    expect(result.fixedResult?.result).toBe('中文A中文');
  });

  test('source-map consistency errors escape rule error collection', () => {
    const mutatingRule: LintMdRule = {
      meta: { name: 'mutate-text-node' },
      create: context => ({
        text: (node) => {
          (node as { value: string }).value = '';
          new TextScanner(node as any, context.sourceCode).matchAt(0, 1);
          context.report({ loc: node.position, message: 'unreachable' });
        }
      })
    };
    const input = '中文(test)中文';

    expect(() => runLint(input, [{ rule: mutatingRule }]))
      .toThrow(SourceMapConsistencyError);
    expect(input).toBe('中文(test)中文');
    expect(() => runLint(input, [{ rule: mutatingRule }], { ruleErrorPolicy: 'strict' }))
      .toThrow(SourceMapConsistencyError);
  });

  test('source-map errors escape the rule create phase', () => {
    const mutatingRule: LintMdRule = {
      meta: { name: 'mutate-during-create' },
      create: (context) => {
        const paragraph = context.ast.children[0] as any;
        const node = paragraph.children[0];
        node.value = '';
        context.sourceCode.getTextRange(node, 0, 1);
        return {};
      }
    };

    expect(() => runLint('text', [{ rule: mutatingRule }]))
      .toThrow(SourceMapConsistencyError);
  });

  test('source-map errors escape the rule fix phase', () => {
    const mutatingRule: LintMdRule = {
      meta: { name: 'mutate-during-fix' },
      create: context => ({
        text: (node) => {
          context.report({
            loc: node.position,
            message: 'trigger mapped fix',
            fix: () => {
              (node as { value: string }).value = '';
              const range = context.sourceCode.getTextRange(node as any, 0, 1);
              return { range, text: 'x' };
            }
          });
        }
      })
    };
    expect(() => runLint('text', [{ rule: mutatingRule }], { computeFixes: true }))
      .toThrow(SourceMapConsistencyError);
  });
});
