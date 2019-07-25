import fix from '../fix';

describe('no-empty-code-lang', () => {
  test('no fix', () => {
    const md = '```js\n' +
               'const a = 1;\n' +
               '```';
    expect(fix(md)).toEqual(md);
  });

  test('fail', () => {
    const md = '```\n' +
               'const b = 2;\n' +
               '```';
    expect(fix(md)).toBe('```plain\n' +
      'const b = 2;\n' +
      '```');
  });
});
