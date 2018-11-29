const lint = require('../lint');

describe('no-trailing-punctuation', () => {
  test('success', () => {
    const md = `## header 2`;
    expect(lint(md)).toEqual([]);
  });

  test('fail', () => {
    const md = `### header 3**!**`;
    expect(lint(md)).toEqual([{
      column: 1,
      level: 'error',
      line: 1,
      text: `Header content can not end with symbol: 'header 3!'`,
      type: 'no-trailing-punctuation'
    }]);
  });
});
