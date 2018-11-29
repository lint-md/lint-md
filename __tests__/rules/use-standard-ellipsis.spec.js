const lint = require('../lint');

describe('use-standard-ellipsis', () => {
  test('success', () => {
    const md = `> 你好，讲个故事……结束`;
    expect(lint(md)).toEqual([]);
  });

  test('fail', () => {
    const md = `hello world....`;
    expect(lint(md)).toEqual([{
      column: 13,
      level: 'error',
      line: 1,
      text: `Non-standard ellipsis exists: 'o world....'`,
      type: 'use-standard-ellipsis'
    }]);
  });

  test('fail', () => {
    const md = `hello world…`;
    expect(lint(md)).toEqual([{
      column: 13,
      level: 'error',
      line: 1,
      text: `Non-standard ellipsis exists: 'o world…'`,
      type: 'use-standard-ellipsis'
    }]);
  });
});