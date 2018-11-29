const lint = require('../lint');

describe('no-space-in-links', () => {
  test('success', () => {
    const md = `[hello world](https://atool.vip)`;
    expect(lint(md)).toEqual([]);
  });

  test('fail', () => {
    const md = `[ hello, ~~world~~ ](https://atool.vip)`;
    expect(lint(md)).toEqual([{
      column: 1,
      level: 'error',
      line: 1,
      text: `Link content can not start / end with space: ' hello, world '`,
      type: 'no-space-in-link'
    }]);
  });
});
