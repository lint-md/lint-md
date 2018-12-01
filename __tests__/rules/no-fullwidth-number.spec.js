const lint = require('../lint');

describe('no-fullwidth-number', () => {
  test('success', () => {
    const md = `> 这件蛋糕只卖 1000 元。`;
    expect(lint(md)).toEqual([]);
  });

  test('fail', () => {
    const md = `> 这件蛋糕只卖 １０００ 元。`;
    expect(lint(md)).toEqual([{
      column: 11,
      level: 'error',
      line: 1,
      text: `Full-width number exist: '１０００'`,
      type: 'no-fullwidth-number'
    }]);
  });
});
