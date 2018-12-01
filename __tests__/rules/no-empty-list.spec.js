const lint = require('../lint');

describe('no-empty-list', () => {
  test('success', () => {
    const md = '1.success';
    expect(lint(md)).toEqual([]);
  });

  test('fail', () => {
    const md = '1. hello\n' +
               '2.';
    expect(lint(md)).toEqual([{
      column: 1,
      level: 'error',
      line: 2,
      text: 'List content can not be empty',
      type: 'no-empty-list'
    }]);
  });
});
