const lint = require('../lint');

describe('no-special-characters', () => {
  test('success', () => {
    const md = '1.success';
    expect(lint(md)).toEqual([]);
  });

  test('fail', () => {
    const md = 'hello world, before here has a \b.';
    expect(lint(md)).toEqual([{
      column: 15,
      level: 'error',
      line: 1,
      text: `Special characters exist: 'orld, befor'`,
      type: 'no-special-characters'
    }]);
  });
});
