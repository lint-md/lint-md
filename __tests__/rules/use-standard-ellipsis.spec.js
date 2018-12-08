import lint from '../lint';

describe('use-standard-ellipsis', () => {
  test('success', () => {
    const md = `> 你好，讲个故事……结束`;
    expect(lint(md)).toEqual([]);
  });

  test('fail', () => {
    const md = `hello world....`;
    expect(lint(md)).toEqual([{
      level: 'error',
      start: {
        line: 1,
        column: 12,
      },
      end: {
        line: 1,
        column: 16,
      },
      text: `Non-standard ellipsis exists: 'o world....'`,
      type: 'use-standard-ellipsis'
    }]);
  });

  test('fail', () => {
    const md = `hello world…`;
    expect(lint(md)).toEqual([{
      level: 'error',
      start: {
        line: 1,
        column: 12,
      },
      end: {
        line: 1,
        column: 13,
      },
      text: `Non-standard ellipsis exists: 'o world…'`,
      type: 'use-standard-ellipsis'
    }]);
  });
});
