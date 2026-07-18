import { runLint } from '../../src/core/run-lint';
import { lintMarkdownInternal } from '../../src/core/lint-markdown';
import { RuleExecutionFailure } from '../../src/utils/rule-execution-errors';
import { parseMdWithSourceMap } from '@lint-md/parser';
import { TextScanner, registerTextNodeSourceMap } from '../../src/utils/text-scanner';
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
    const getSourceRange = jest.fn((_node: unknown, _start: number, _end: number) => node.position);
    registerTextNodeSourceMap(
      { type: 'root', children: [node], position: node.position } as any,
      { getSourceRange } as any
    );

    new TextScanner(node as any).forEachChar(() => {});
    expect(getSourceRange).not.toHaveBeenCalled();

    const positions: Array<{ endOffset: number }> = [];
    new TextScanner(node as any).forEachChar((_char, _index, pos) => {
      positions.push(pos);
    });
    expect(getSourceRange).not.toHaveBeenCalled();
    positions.forEach(pos => void pos.endOffset);
    expect(getSourceRange).toHaveBeenCalledTimes(3);
    expect(getSourceRange.mock.calls.map(([, start, end]) => [start, end]))
      .toEqual([[0, 1], [1, 2], [2, 3]]);
  });

  test('keeps inlineCode on the identity fallback instead of registering an unsupported source map', () => {
    const { ast, sourceMap } = parseMdWithSourceMap('`code`');
    registerTextNodeSourceMap(ast, sourceMap);
    const inlineCode = (ast.children[0] as any).children[0];
    expect(inlineCode.type).toBe('inlineCode');
    expect(new TextScanner(inlineCode).matchAt(0, 1).absoluteRange).toEqual([0, 1]);
  });

  test.each([
    ['escaped', '中文\\(test\\)中文', '中文（test）中文'],
    ['numeric entity', '中文&#40;test&#41;中文', '中文（test）中文']
  ])('%s fixes the complete source construct and converges', (_name, input, expected) => {
    const first = lintMarkdownInternal(input, halfWidthConfig, true);
    expect(first.fixedResult?.result).toBe(expected);

    const second = lintMarkdownInternal(first.fixedResult!.result, halfWidthConfig, false);
    expect(second.lintResult.ruleManager.getReportData()).toHaveLength(0);
  });

  test('diagnostic offsets and fix ranges are resolved by the same source-map range', () => {
    const input = '中文&#40;test&#41;中文';
    const { ruleManager } = runLint(input, halfWidthConfig);
    const reports = ruleManager.getReportData();
    const fixes = ruleManager.getAllFixes();

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
    const { ruleManager } = runLint(input, halfWidthConfig);
    const [report] = ruleManager.getReportData();
    const [fix] = ruleManager.getAllFixes();

    expect(report.loc.start).toMatchObject({ line: 2, column: 3, offset: expectedOffset });
    expect(fix.range).toEqual([report.loc.start.offset, report.loc.end.offset]);
  });

  test('an entity decoded to two UTF-16 units is scanned and fixed once as an atomic source range', () => {
    const atomicRule: LintMdRule = {
      meta: { name: 'atomic-entity' },
      create: context => ({
        text: node => {
          const scanner = new TextScanner(node as any);
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
    expect(result.lintResult.ruleManager.getReportData()).toHaveLength(1);
    expect(result.fixedResult?.result).toBe('中文A中文');
  });

  test('source-map consistency errors are collected and do not produce fixes', () => {
    const mutatingRule: LintMdRule = {
      meta: { name: 'mutate-text-node' },
      create: context => ({
        text: node => {
          (node as { value: string }).value = 'changed';
          new TextScanner(node as any).matchAt(0, 1);
          context.report({ loc: node.position, message: 'unreachable' });
        }
      })
    };
    const input = '中文(test)中文';
    const result = runLint(input, [{ rule: mutatingRule }]);
    expect(result.executionErrors).toEqual([
      expect.objectContaining({ ruleName: 'mutate-text-node', phase: 'selector' })
    ]);
    expect(result.ruleManager.getAllFixes()).toEqual([]);
    expect(input).toBe('中文(test)中文');
    expect(() => runLint(input, [{ rule: mutatingRule }], { ruleErrorPolicy: 'strict' }))
      .toThrow(RuleExecutionFailure);
  });
});
