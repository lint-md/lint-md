import fix from '../fix';

describe('no-fullwidth-number', () => {
  test('no ix', () => {
    const md = `> 这件蛋糕只卖 1000 元。`;
    expect(fix(md)).toBe(md);
  });

  test('fail', () => {
    const md = `> 这件蛋糕只卖 １０００ 元。\n这个 １０ 哈哈`;
    expect(fix(md)).toBe(`> 这件蛋糕只卖 1000 元。\n这个 10 哈哈`);
  });
});
