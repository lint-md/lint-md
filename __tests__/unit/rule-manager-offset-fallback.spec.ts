import { runLint } from '../../src/core/run-lint';
import type { LintMdRule, PositionedTextNode, ReportOption } from '../../src/types';
import { isValidOffset } from '../../src/utils/rule-manager';
import noLongCode from '../../src/rules/no-long-code';
import noHalfWidthPunctuation from '../../src/rules/no-half-width-punctuation';
import useStandardEllipsis from '../../src/rules/use-standard-ellipsis';

/** 构造一条只针对 text 节点上报、loc 由调用方决定的规则，消除测试里的重复模板。 */
const makeTextReportRule = (
  name: string,
  getLoc: (node: PositionedTextNode) => ReportOption['loc']
): LintMdRule => ({
  meta: { name },
  create: context => ({
    text: (node: PositionedTextNode) => {
      context.report({ loc: getLoc(node), message: name });
    }
  })
});

const runRule = (md: string, rule: LintMdRule, options?: Record<string, any>) => {
  const lintResult = runLint(md, [{ rule, options }]);
  return {
    data: lintResult.ruleManager.getReportData(),
    fallbackHits: lintResult.ruleManager.getFallbackHits()
  };
};

describe('rule-manager offset contract: cross-rule fallbackHits is 0 (#180)', () => {
  test('no-long-code: CRLF reports retain precise offsets', () => {
    const longCode = 'x'.repeat(120);
    const md = ['```js', longCode, '```'].join('\r\n');
    const { data, fallbackHits } = runRule(md, noLongCode, { length: 50 });
    expect(fallbackHits).toBe(0);
    expect(data.length).toBeGreaterThan(0);
    for (const item of data) {
      expect(isValidOffset(item.loc.start.offset)).toBe(true);
      expect(isValidOffset(item.loc.end.offset)).toBe(true);
      expect(item.content.length).toBeLessThan(md.length);
    }
  });

  test('no-long-code: unclosed fenced reports retain precise offsets', () => {
    const longCode = 'x'.repeat(120);
    const md = ['```js', longCode].join('\n');
    const { data, fallbackHits } = runRule(md, noLongCode, { length: 50 });
    expect(fallbackHits).toBe(0);
    expect(data[0].loc.start.offset).toBe(md.indexOf(longCode));
    expect(data[0].content.length).toBeLessThan(md.length);
  });

  test('no-long-code: indented code reports retain precise offsets', () => {
    const longCode = 'x'.repeat(120);
    const md = `    ${longCode}`;
    const { data, fallbackHits } = runRule(md, noLongCode, { length: 50 });
    expect(fallbackHits).toBe(0);
    expect(data[0].loc.start.offset).toBe(md.indexOf(longCode));
  });

  test('no-half-width-punctuation: synthesized loc does not trigger fallback', () => {
    const md = '这是一个测试(example)例子。';
    const { data, fallbackHits } = runRule(md, noHalfWidthPunctuation);
    expect(fallbackHits).toBe(0);
    expect(data.length).toBeGreaterThan(0);
    for (const item of data) {
      expect(isValidOffset(item.loc.start.offset)).toBe(true);
      expect(item.content.length).toBeLessThan(md.length);
    }
  });

  test('use-standard-ellipsis: synthesized loc does not trigger fallback', () => {
    const md = 'hello world....这是测试';
    const { data, fallbackHits } = runRule(md, useStandardEllipsis);
    expect(fallbackHits).toBe(0);
    expect(data.length).toBeGreaterThan(0);
    for (const item of data) {
      expect(isValidOffset(item.loc.start.offset)).toBe(true);
    }
  });
});

describe('rule-manager offset contract: resolveOffset fallback slices correctly (#180)', () => {
  test('rule reporting without offset triggers exactly one fallback hit', () => {
    // 仅针对 strong 节点上报，并去掉 offset 模拟缺失场景（text 选择器会命中多个节点，这里用强节点定位）。
    const syntheticRule: LintMdRule = {
      meta: { name: 'synthetic-no-offset' },
      create: context => ({
        strong: (node) => {
          const startPos = node.position.start;
          const endPos = node.position.end;
          context.report({
            loc: {
              start: { line: startPos.line, column: startPos.column },
              end: { line: endPos.line, column: endPos.column }
            },
            message: 'synthetic report without offset'
          });
        }
      })
    };

    const md = '前置文本 **加粗 中文** 后置文本很长很长很长很长很长很长';
    const { data, fallbackHits } = runRule(md, syntheticRule);

    expect(fallbackHits).toBe(1);
    expect(data).toHaveLength(1);
    // 兜底切片应只截取报告位置附近内容（整篇文档的子串），而非整篇文档。
    expect(data[0].content.length).toBeGreaterThan(0);
    expect(data[0].content.length).toBeLessThan(md.length);
    expect(data[0].content).toContain('加粗 中文');
  });
});

describe('rule-manager offset contract: invalid offsets trigger fallback (#180 P2)', () => {
  test.each([
    ['NaN', NaN],
    ['Infinity', Infinity],
    ['negative', -3]
  ])('offset %s is treated as missing (fallbackHits === 1)', (_label, badOffset) => {
    const rule = makeTextReportRule('invalid-offset', node => ({
      start: { line: node.position.start.line, column: node.position.start.column, offset: badOffset },
      end: { line: node.position.end.line, column: node.position.end.column, offset: (badOffset as number) + 1 }
    }));
    const md = ['aa', 'bb 中文', 'cc'].join('\n');
    const { fallbackHits } = runRule(md, rule);
    expect(fallbackHits).toBe(1);
  });

  test('valid integer offset does not trigger fallback and slices exactly', () => {
    const md = 'aaa\r\nbbbZZccc\r\n';
    const start = md.indexOf('ZZ');
    const end = start + 'ZZ'.length;
    const rule = makeTextReportRule('exact-offset', (node) => {
      const idx = node.value.indexOf('ZZ');
      if (idx < 0)
        return { start: node.position.start, end: node.position.end };
      const s = (node.position.start.offset as number) + idx;
      const e = s + 'ZZ'.length;
      return {
        start: { line: node.position.start.line, column: node.position.start.column, offset: s },
        end: { line: node.position.end.line, column: node.position.end.column, offset: e }
      };
    });
    const { data, fallbackHits } = runRule(md, rule);
    expect(fallbackHits).toBe(0);
    expect(data).toHaveLength(1);
    expect(data[0].content).toBe(
      md.slice(Math.max(0, start - 5), Math.min(md.length, end + 5))
    );
  });
});
