const lint = require('../lint');

describe('no-empty-code', () => {
  test('success', () => {
    const md = '```js\n' +
               'const a = 0;\n' +
               '```';
    expect(lint(md)).toEqual([]);
  });

  test('fail', () => {
    const md = '```js\n' +
               '```';
    expect(lint(md)).toEqual([{
      column: 1,
      level: 'error',
      line: 1,
      text: 'Code block can not be empty',
      type: 'no-empty-code'
    }]);
  });

  test('fail', () => {
    const md = '``';
    expect(lint(md)).toEqual([{
      column: 1,
      level: 'error',
      line: 1,
      text: 'Code block can not be empty',
      type: 'no-empty-code'
    }]);
  });
});
