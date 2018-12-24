import lint from '../lint';

describe('no-fullwidth-number', () => {
  test('success', () => {
    const md = `> 这件蛋糕只卖 1000 元。`;
    expect(lint(md)).toEqual([]);
  });

  test('fail', () => {
    const md = `> 这件蛋糕只卖 １０００ 元。`;
    expect(lint(md)).toEqual([{
      level: 'error',
      start: {
        line: 1,
        column: 11,
      },
      end: {
        line: 1,
        column: 15,
      },
      text: `'１０００'`,
      type: 'no-fullwidth-number'
    }]);
  });
});
