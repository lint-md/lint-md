import lint from '../lint';

describe('no-empty-code-lang', () => {
  test('success', () => {
    const md = '```js\n' +
               'const a = 1;\n' +
               '```';
    expect(lint(md)).toEqual([]);
  });

  test('fail', () => {
    const md = '```\n' +
               'const b = 2;\n' +
               '```';
    expect(lint(md)).toEqual([{
      level: 'error',
      start: {
        line: 1,
        column: 1,
      },
      end: {
        line: 1,
        column: 4,
      },
      text: '',
      type: 'no-empty-code-lang'
    }]);
  });
});
