import type { LintSourceCode } from '../../../src/types';
import type { MarkdownTextNode } from '../../../src/utils/get-text-nodes';
import { registerTextNodeAnalysisConsumer } from '../../../src/utils/text-rule-scan';

const makeNode = (value: string): MarkdownTextNode => ({
  type: 'text',
  value,
  position: {
    start: { line: 1, column: 1, offset: 0 },
    end: { line: 1, column: value.length + 1, offset: value.length }
  }
}) as MarkdownTextNode;

const makeSourceCode = (): LintSourceCode => ({} as LintSourceCode);

describe('text rule scan', () => {
  test('shares one scan for the same node value', () => {
    const node = makeNode('中文1(test),English');
    const sourceCode = makeSourceCode();
    const firstConsumer = registerTextNodeAnalysisConsumer(sourceCode);
    const secondConsumer = registerTextNodeAnalysisConsumer(sourceCode);

    expect(secondConsumer).toBe(firstConsumer);
    expect(firstConsumer.consumerCount).toBe(2);
    expect(firstConsumer.get(node)).toBe(secondConsumer.get(node));
  });

  test('classifies Unicode code points and collects rule candidates', () => {
    const session = registerTextNodeAnalysisConsumer(makeSourceCode());
    const scan = session.get(makeNode('𠀀A1(test),'));

    expect(scan.alphabetBoundaries).toEqual([{
      start: 0,
      totalLength: 3,
      firstCharacterLength: 2
    }]);
    expect(scan.numberBoundaries).toEqual([]);
    expect(scan.punctuationCharacters.map(({ char, index }) => [char, index]))
      .toEqual([['(', 4], [')', 9], [',', 10]]);
    expect(scan.parenthesisPairs).toEqual([[4, 9]]);
  });

  test('refreshes the scan after a node value changes', () => {
    const node = makeNode('中文1');
    const session = registerTextNodeAnalysisConsumer(makeSourceCode());
    const first = session.get(node);

    node.value = '中文A';
    const second = session.get(node);

    expect(second).not.toBe(first);
    expect(second.alphabetBoundaries).toEqual([{
      start: 1,
      totalLength: 2,
      firstCharacterLength: 1
    }]);
    expect(second.numberBoundaries).toEqual([]);
  });
});
