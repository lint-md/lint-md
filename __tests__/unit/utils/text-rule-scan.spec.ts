import { registerTextRuleScanConsumer } from '../../../src/utils/text-rule-scan';

const makeNode = (value: string) => ({
  type: 'text',
  value,
  position: {
    start: { line: 1, column: 1, offset: 0 },
    end: { line: 1, column: value.length + 1, offset: value.length }
  }
});

describe('text rule scan', () => {
  test('shares one scan for the same node value', () => {
    const node = makeNode('中文1(test),English');
    const sourceCode = {} as any;
    const firstConsumer = registerTextRuleScanConsumer(sourceCode);
    const secondConsumer = registerTextRuleScanConsumer(sourceCode);

    expect(secondConsumer).toBe(firstConsumer);
    expect(firstConsumer.consumerCount).toBe(2);
    expect(firstConsumer.get(node as any)).toBe(secondConsumer.get(node as any));
  });

  test('classifies Unicode code points and collects rule candidates', () => {
    const session = registerTextRuleScanConsumer({} as any);
    const scan = session.get(makeNode('𠀀A1(test),') as any);

    expect(scan.alphabetBoundaries).toEqual([{
      index: 0,
      length: 3,
      firstLength: 2
    }]);
    expect(scan.numberBoundaries).toEqual([]);
    expect(scan.punctuationCharacters.map(({ char, index }) => [char, index]))
      .toEqual([['(', 4], [')', 9], [',', 10]]);
    expect(scan.parenthesisPairs).toEqual([[4, 9]]);
  });

  test('refreshes the scan after a node value changes', () => {
    const node = makeNode('中文1');
    const session = registerTextRuleScanConsumer({} as any);
    const first = session.get(node as any);

    node.value = '中文A';
    const second = session.get(node as any);

    expect(second).not.toBe(first);
    expect(second.alphabetBoundaries).toEqual([{
      index: 1,
      length: 2,
      firstLength: 1
    }]);
    expect(second.numberBoundaries).toEqual([]);
  });
});
