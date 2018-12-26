import Text from '../../../src/fix-rules/helper/Text';

describe('Text', () => {
  const text = new Text(`1123456789
21234567890
31234567890`);

  test('removeLine', () => {
    expect(text.removeLine(1).result()).toBe(`21234567890
31234567890`);
  });

  test('insertLine', () => {
    expect(text.insertLine(1, '1123456789').result()).toBe(`1123456789
21234567890
31234567890`);
  });

  test('insertBlock', () => {
    expect(text.insertBlock(2, 5,'11111\n11111\n11111\n11111').result()).toBe(`1123456789
212311111
11111
11111
111114567890
31234567890`);
  });

  test('removeBolck', () => {
    expect(text.removeBlock({ line: 2, column: 5 }, { line: 5, column: 6 }).result()).toBe(`1123456789
21234567890
31234567890`);
  });
});
