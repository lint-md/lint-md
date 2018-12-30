import fix from '../fix';

describe('use-standard-ellipsis', () => {
  test('no fix', () => {
    const md = `> 你好，讲个故事……结束`;
    expect(fix(md)).toBe(md);
  });

  test('fix 1', () => {
    const md = `hello world....`;
    expect(fix(md)).toBe('hello world……');
  });

  test('fix 2', () => {
    const md = `hello world…`;
    expect(fix(md)).toBe('hello world……');
  });
});
