import { parseMd } from '@lint-md/parser';
import { isValidOffset } from '../../src/utils/rule-manager';

interface OffsetContractIssue {
  type: string
  hasPosition: boolean
  hasStart: boolean
  hasEnd: boolean
  startOffsetValid: boolean
  endOffsetValid: boolean
}

/** 递归收集所有 position 不完整的 AST 节点（缺 position / start / end 或 offset 非法）。 */
const collectOffsetContractIssues = (
  node: unknown,
  issues: OffsetContractIssue[] = []
): OffsetContractIssue[] => {
  if (!node || typeof node !== 'object')
    return issues;
  const record = node as Record<string, any>;

  if (typeof record.type === 'string') {
    const pos = record.position;
    const hasPosition = Boolean(pos);
    const hasStart = Boolean(pos?.start);
    const hasEnd = Boolean(pos?.end);
    const startOffsetValid = isValidOffset(pos?.start?.offset);
    const endOffsetValid = isValidOffset(pos?.end?.offset);

    if (!hasPosition || !hasStart || !hasEnd || !startOffsetValid || !endOffsetValid) {
      issues.push({
        type: record.type,
        hasPosition,
        hasStart,
        hasEnd,
        startOffsetValid,
        endOffsetValid
      });
    }
  }

  for (const [key, value] of Object.entries(record)) {
    if (key === 'parent' || key === 'position')
      continue;
    if (Array.isArray(value)) {
      for (const child of value) collectOffsetContractIssues(child, issues);
    }
    else if (value && typeof value === 'object') {
      collectOffsetContractIssues(value, issues);
    }
  }
  return issues;
};

describe('parser offset contract: parseMd position completeness (#180)', () => {
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
    const issues = collectOffsetContractIssues(ast);
    expect(issues).toHaveLength(0);
  });

  test('detects nodes missing position / start / end / offset entirely', () => {
    // 模拟 parser 回归：缺 position、start/end 不完整、offset 非法（NaN/Infinity/负数）
    // 都应被捕获，而非静默跳过。
    const malformed = {
      type: 'root',
      position: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 5, offset: 4 } },
      children: [
        { type: 'text', value: 'a' },
        { type: 'text', value: 'b', position: { start: undefined, end: undefined } },
        { type: 'text', value: 'c', position: { start: { line: 1, column: 1 }, end: undefined } },
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
    const issues = collectOffsetContractIssues(malformed);
    expect(issues).toHaveLength(5);
    expect(issues.every(i => i.type === 'text')).toBe(true);
  });
});
