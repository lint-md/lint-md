import lint from '../lint';

describe('no-space-in-link', () => {
  test('success', () => {
    const md = `[hello world](https://atool.vip)`;
    expect(lint(md)).toEqual([]);
  });

  test('fail', () => {
    const md = `[ hello, ~~world~~ ](https://atool.vip)`;
    expect(lint(md)).toEqual([{
      level: 'error',
      start: {
        line: 1,
        column: 2,
      },
      end: {
        line: 1,
        column: 20,
      },
      text: `Link content can not start / end with space: ' hello, world '`,
      type: 'no-space-in-link'
    }]);
  });
});
