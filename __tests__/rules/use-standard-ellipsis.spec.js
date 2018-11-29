const lint = require('../lint');

describe('use-standard-ellipsis', () => {
  test('success', () => {
    const md = `> 你好，讲个故事……结束`;
    expect(lint(md)).toEqual([]);
  });

  test('fail', () => {
    const md = `....hello world`;
    expect(lint(md)).toEqual([{
      column: 2,
      level: 'error',
      line: 1,
      text: `Non-standard ellipsis exists: '....hello worl'`,
      type: 'use-standard-ellipsis'
    }]);
  });

  test('fail', () => {
    const md = `…hello world`;
    expect(lint(md)).toEqual([{
      column: 2,
      level: 'error',
      line: 1,
      text: `Non-standard ellipsis exists: '…hello world'`,
      type: 'use-standard-ellipsis'
    }]);
  });
});