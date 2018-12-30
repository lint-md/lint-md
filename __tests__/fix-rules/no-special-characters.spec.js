import fix from '../fix';

describe('no-special-characters', () => {
  test('no fix', () => {
    const md = '1.success';
    expect(fix(md)).toBe(md);
  });

  test('fix', () => {
    const md = 'hello world, before here has a \\b.';
    expect(fix(md)).toBe('hello world, before here has a \\b.');
  });
});
