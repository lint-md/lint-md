import lint from '../lint';

describe('no-empty-url', () => {
  test('success', () => {
    const md = '[baidu](https://baidu.com)';
    expect(lint(md)).toEqual([]);
  });

  test('fail', () => {
    const md = '![world]().';
    expect(lint(md)).toEqual([{
      level: 'error',
      start: {
        line: 1,
        column: 10,
      },
      end: {
        line: 1,
        column: 11,
      },
      text: '',
      type: 'no-empty-url'
    }]);
  });
});
