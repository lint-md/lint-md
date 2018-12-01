const lint = require('../lint');

describe('no-empty-code-lang', () => {
  test('success', () => {
    const md = "```js\n" + 
               "const a = 1;\n" +
               "```";
    expect(lint(md)).toEqual([]);
  });

  test('fail', () => {
    const md = "```\n" +
               "const b = 2;\n" +
               "```";
    expect(lint(md)).toEqual([{
      column: 1,
      level: 'error',
      line: 1,
      text: 'Language of code can not be empty',
      type: 'no-empty-code-lang'
    }]);
  });
});
