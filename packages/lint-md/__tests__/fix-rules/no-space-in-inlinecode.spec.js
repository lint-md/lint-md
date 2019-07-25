import fix from '../fix';

describe('no-space-in-inlinecode', () => {
  test('no fix', () => {
    const md = '`hello world!`';
    expect(fix(md)).toBe(md);
  });

  test('fail', () => {
    const md = '``` hello, world! ```';
    expect(fix(md)).toBe('`hello, world!`');
  });
});
