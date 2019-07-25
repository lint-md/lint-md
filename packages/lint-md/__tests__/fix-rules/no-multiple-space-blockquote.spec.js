import fix from '../fix';

describe('no-multiple-space-blockquote', () => {
  test('no fix', () => {
    const md = `> hello world.`;
    expect(fix(md)).toBe(md);
  });

  test('fix', () => {
    const md = `>  hello world.`;
    expect(fix(md)).toBe('> hello world.');
  });
});
