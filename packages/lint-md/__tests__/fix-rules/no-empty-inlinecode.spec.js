import fix from '../fix';

describe('no-empty-inlinecode', () => {
  test('no fix', () => {
    const md = '`const a = 0;`';
    expect(fix(md)).toBe(md);
  });

  test('fix', () => {
    const md = '- right `` 你好';
    expect(fix(md)).toBe('- right  你好');
  });
});
