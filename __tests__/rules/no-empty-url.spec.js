const lint = require('../lint');

describe('no-empty-url', () => {
  test('success', () => {
    const md = '[baidu](https://baidu.com)';
    expect(lint(md)).toEqual([]);
  });

  test('fail', () => {
    const md = '![world]().';
    expect(lint(md)).toEqual([{
      column: 1,
      level: 'error',
      line: 1,
      text: 'Image url can not be empty',
      type: 'no-empty-url'
    }]);
  });
});
