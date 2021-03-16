import Text from '../../../src/helper/Text';

describe('Text', () => {
  const origin = `1123456789
21234567890
31234567890`;

  const text = new Text(origin);

  test('removeLine', () => {
    expect(text.removeLine(1).result()).toBe(`21234567890
31234567890`);
  });

  test('removeLines', () => {
    expect(text.removeLines(1, 2).result()).toBe('');
  });

  test('insertLine', () => {
    expect(text.insertLines(1, '1123456789', '21234567890', '31234567890').result()).toBe(origin);
  });

  test('insertBlock', () => {
    expect(text.insertBlock(2, 5, '11111\n11111\n11111\n11111').result()).toBe(`1123456789
212311111
11111
11111
111114567890
31234567890`);
  });

  test('removeBlock', () => {
    expect(text.removeBlock({ line: 2, column: 5 }, { line: 5, column: 6 }).result()).toBe(origin);
  });

  test('getBlock', () => {
    expect(text.getBlock({ line: 2, column: 5 }, { line: 3, column: 6 })).toBe('4567890\n31234');
  });

  test('removeBlock one line', () => {
    expect(text.removeBlock({ line: 1, column: 5 }, {
      line: 1,
      column: 8
    }).result()).toBe('1123789\n21234567890\n31234567890');
  });
});
