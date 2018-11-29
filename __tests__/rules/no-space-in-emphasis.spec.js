const lint = require('../lint');

describe('no-space-in-emphasis', () => {
  test('success', () => {
    const md = `**hello, ~~world~~**`;
    expect(lint(md)).toEqual([]);
  });

  test('fail', () => {
    const md = `** hello, ~~world~~ **`;
    expect(lint(md)).toEqual([{
      column: 1,
      level: 'error',
      line: 1,
      text: `Emphasis content can not start / end with space: ' hello, world '`,
      type: 'no-space-in-emphasis'
    }]);
  });
});
