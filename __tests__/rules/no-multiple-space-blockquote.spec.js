const lint = require('../lint');

describe('no-multiple-space-blockquote', () => {
  test('success', () => {
    const md = `> hello world.`;
    expect(lint(md)).toEqual([]);
  });

  test('fail', () => {
    const md = `>  hello world.`;
    expect(lint(md)).toEqual([{
      column: 1,
      level: 'error',
      line: 1,
      text: `Blockquote content can not start with space: ' hello world...'`,
      type: 'no-multiple-space-blockquote'
    }]);
  });
});
