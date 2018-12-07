const lint = require('../lint');

describe('no-empty-blockquote', () => {
  test('success', () => {
    const md = ` - right

> hello world!`;
    expect(lint(md)).toEqual([]);
  });

  test('fail', () => {
    const md = `- wrong

> `;
    expect(lint(md)).toEqual([{
      level: 'error',
      start: {
        line: 3,
        column: 1,
      },
      end: {
        line: 3,
        column: 3,
      },
      text: 'Blockquote content can not be empty',
      type: 'no-empty-blockquote'
    }]);
  });
});
