
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
      column: 1,
      level: 'error',
      line: 3,
      text: 'Blockquote content can not be empty',
      type: 'no-empty-blockquote'
    }]);
  });
});
