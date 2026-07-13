import { parseMd } from '@lint-md/parser';
import { runLint } from '../../src/core/run-lint';
import type { LintMdRule, PositionedTextNode } from '../../src/types';
import noLongCode from '../../src/rules/no-long-code';
import noHalfWidthPunctuation from '../../src/rules/no-half-width-punctuation';
import useStandardEllipsis from '../../src/rules/use-standard-ellipsis';

/** 递归收集所有 position 不完整的 AST 节点（缺 position / start / end 或 offset 非法）。 */
const collectMissingOffsetNodes = (
  node: unknown,
  acc: Array<{
    type: unknown;
    hasPosition: boolean;
    hasStart: boolean;
    hasEnd: boolean;
    startOk: boolean;
    endOk: boolean;
  }> = []
): typeof acc => {
  if (!node || typeof node !== 'object') return acc;
  const record = node as Record<string, any>;

  if (typeof record.type === 'string') {
    const pos = record.position;
    const hasPosition = Boolean(pos);
    const hasStart = Boolean(pos?.start);
    const hasEnd = Boolean(pos?.end);
    // 合法 offset 必须是有限非负整数，排除 NaN / Infinity。
    const startOk = Number.isInteger(pos?.start?.offset) && (pos?.start?.offset as number) >= 0;
    const endOk = Number.isInteger(pos?.end?.offset) && (pos?.end?.offset as number) >= 0;

    if (!hasPosition || !hasStart || !hasEnd || !startOk || !endOk) {
      acc.push({ type: record.type, hasPosition, hasStart, hasEnd, startOk, endOk });
    }
  }

  for (const [key, value] of Object.entries(record)) {
    if (key === 'parent' || key === 'position') continue;
    if (Array.isArray(value)) {
      for (const child of value) collectMissingOffsetNodes(child, acc);
    } else if (value && typeof value === 'object') {
      collectMissingOffsetNodes(value, acc);
    }
  }
  return acc;
};

const findReport = (md: string, rule: LintMdRule, options?: Record<string, any>) => {
  const lintResult = runLint(md, [{ rule, options }]);
  const data = lintResult.ruleManager.getReportData();
  return { data, fallbackHits: lintResult.ruleManager.getFallbackHits() };
};

describe('offset contract: parseMd position completeness (#180)', () => {
  const cases: Array<[string, string]> = [
    ['plain', 'hello world 中文'],
    ['crlf', 'line1\r\nline2 中文\r\nline3'],
    ['unclosed fenced', '```\ncode no close\nstill code'],
    ['indented code', '    indented code here\nnormal text'],
    ['fenced', '```js\nconst a = 1;\n```'],
    ['list', '- a\n- b 中文']
  ];

  test.each(cases)('parser yields complete offsets for %s', (_label, md) => {
    const ast = parseMd(md);
    const missing = collectMissingOffsetNodes(ast);
    expect(missing).toHaveLength(0);
  });

  test('detects nodes missing position / start / end / offset entirely', () => {
    // 模拟 parser 回归：缺 position、start/end 不完整、offset 非法（NaN/Infinity/负数）
    // 都应被 collectMissingOffsetNodes 捕获，而非静默跳过。
    const malformed = {
      type: 'root',
      position: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 5, offset: 4 } },
      children: [
        { type: 'text', value: 'a' }, // 缺 position
        { type: 'text', value: 'b', position: { start: undefined, end: undefined } }, // position 内无 start/end
        {
          type: 'text',
          value: 'c',
          position: { start: { line: 1, column: 1 }, end: undefined } // 缺 end
        },
        {
          type: 'text',
          value: 'd',
          position: { start: { line: 1, column: 1, offset: NaN }, end: { line: 1, column: 2, offset: Infinity } }
        },
        {
          type: 'text',
          value: 'e',
          position: { start: { line: 1, column: 1, offset: -3 }, end: { line: 1, column: 2, offset: 4 } }
        }
      ]
    };
    const missing = collectMissingOffsetNodes(malformed);
    // 5 个 text 节点全部应被捕获
    expect(missing).toHaveLength(5);
    expect(missing.every((m) => m.type === 'text')).toBe(true);
  });
});

describe('offset contract: cross-rule fallbackHits is 0 (#180)', () => {
  test('no-long-code: CRLF reports retain precise offsets', () => {
    const longCode = 'x'.repeat(120);
    const md = ['```js', longCode, '```'].join('\r\n');
    const { data, fallbackHits } = findReport(md, noLongCode, { length: 50 });
    expect(fallbackHits).toBe(0);
    expect(data.length).toBeGreaterThan(0);
    for (const item of data) {
      expect(typeof item.loc.start.offset).toBe('number');
      expect(typeof item.loc.end.offset).toBe('number');
      // content 为局部切片，而非整篇文档
      expect(item.content.length).toBeLessThan(md.length);
    }
  });

  test('no-long-code: unclosed fenced reports retain precise offsets', () => {
    const longCode = 'x'.repeat(120);
    const md = ['```js', longCode].join('\n');
    const { data, fallbackHits } = findReport(md, noLongCode, { length: 50 });
    expect(fallbackHits).toBe(0);
    expect(data[0].loc.start.offset).toBe(md.indexOf(longCode));
    expect(data[0].content.length).toBeLessThan(md.length);
  });

  test('no-long-code: indented code reports retain precise offsets', () => {
    const longCode = 'x'.repeat(120);
    const md = `    ${longCode}`;
    const { data, fallbackHits } = findReport(md, noLongCode, { length: 50 });
    expect(fallbackHits).toBe(0);
    expect(data[0].loc.start.offset).toBe(md.indexOf(longCode));
  });

  test('no-half-width-punctuation: synthesized loc does not trigger fallback', () => {
    const md = '这是一个测试(example)例子。';
    const { data, fallbackHits } = findReport(md, noHalfWidthPunctuation);
    expect(fallbackHits).toBe(0);
    expect(data.length).toBeGreaterThan(0);
    for (const item of data) {
      expect(typeof item.loc.start.offset).toBe('number');
      expect(item.content.length).toBeLessThan(md.length);
    }
  });

  test('use-standard-ellipsis: synthesized loc does not trigger fallback', () => {
    const md = 'hello world....这是测试';
    const { data, fallbackHits } = findReport(md, useStandardEllipsis);
    expect(fallbackHits).toBe(0);
    expect(data.length).toBeGreaterThan(0);
    for (const item of data) {
      expect(typeof item.loc.start.offset).toBe('number');
    }
  });
});

describe('offset contract: resolveOffset fallback still slices content correctly (#180)', () => {
  test('rule reporting without offset triggers exactly one fallback hit', () => {
    // 该规则故意只提供 line/column，不提供 offset，以验证防御性兜底：
    // 1. content 仍能被正确切片（而非退化为整篇文档）；
    // 2. fallbackHits 恰好计 1（按报告计数，不重复计 start/end）。
    const syntheticRule: LintMdRule = {
      meta: { name: 'synthetic-no-offset' },
      create: (context) => ({
        // 选中带独立位置的子节点（strong 内部文本），去掉 offset 模拟缺失场景。
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

    // strong 内部文本节点拥有独立位置，兜底切片应是整篇文档的子串。
    const md = '前置文本 **加粗 中文** 后置文本很长很长很长很长很长很长';
    const lintResult = runLint(md, [{ rule: syntheticRule }]);
    const data = lintResult.ruleManager.getReportData();

    expect(lintResult.ruleManager.getFallbackHits()).toBe(1);
    expect(data).toHaveLength(1);
    // 兜底切片应只截取报告位置附近内容，而非整篇文档
    expect(data[0].content.length).toBeGreaterThan(0);
    expect(data[0].content.length).toBeLessThan(md.length);
    // 兜底切片应覆盖该 strong 节点的文本
    expect(data[0].content).toContain('加粗 中文');
  });
});

describe('offset contract: invalid offsets (NaN/Infinity/negative) trigger fallback (#180 P2)', () => {
  const buildRule = (offset: number): LintMdRule => ({
    meta: { name: 'invalid-offset-rule' },
    create: (context) => ({
      text: (node: PositionedTextNode) => {
        context.report({
          loc: {
            start: { line: node.position.start.line, column: node.position.start.column, offset },
            end: { line: node.position.end.line, column: node.position.end.column, offset: offset + 1 }
          },
          message: 'invalid offset report'
        });
      }
    })
  });

  test.each([
    ['NaN', NaN],
    ['Infinity', Infinity],
    ['negative', -3]
  ])('offset %s is treated as missing (fallbackHits === 1)', (_label, badOffset) => {
    const md = ['aa', 'bb 中文', 'cc'].join('\n');
    // text 节点为整段段落文本，fallback 切片不会等于整篇文档
    const lintResult = runLint(md, [{ rule: buildRule(badOffset) }]);
    expect(lintResult.ruleManager.getFallbackHits()).toBe(1);
  });

  test('valid integer offset does not trigger fallback and slices exactly', () => {
    // 多行 CRLF 文档，定位其中 ASCII 子串以便精确计算 offset。
    const md = 'aaa\r\nbbbZZccc\r\n';
    const start = md.indexOf('ZZ');
    const end = start + 'ZZ'.length;
    const rule: LintMdRule = {
      meta: { name: 'exact-offset-rule' },
      create: (context) => ({
        text: (node: PositionedTextNode) => {
          const idx = node.value.indexOf('ZZ');
          if (idx < 0) return;
          const s = (node.position.start.offset as number) + idx;
          const e = s + 'ZZ'.length;
          context.report({
            loc: {
              start: { line: node.position.start.line, column: node.position.start.column, offset: s },
              end: { line: node.position.end.line, column: node.position.end.column, offset: e }
            },
            message: 'exact offset report'
          });
        }
      })
    };
    const lintResult = runLint(md, [{ rule }]);
    expect(lintResult.ruleManager.getFallbackHits()).toBe(0);
    const data = lintResult.ruleManager.getReportData();
    expect(data).toHaveLength(1);
    // 精确切片：向前/向后各扩展 5 个字符
    expect(data[0].content).toBe(
      md.slice(Math.max(0, start - 5), Math.min(md.length, end + 5))
    );
  });
});
