import lint from '../lint';

describe('no-empty-code', () => {
  test('success', () => {
    const md = '`const a = 0;`';
    expect(lint(md)).toEqual([]);
  });

  test('fail', () => {
    const md = '``';
    expect(lint(md)).toEqual([{
      level: 'error',
      start: {
        line: 1,
        column: 1,
      },
      end: {
        line: 1,
        column: 3,
      },
      text: '',
      type: 'no-empty-inlinecode'
    }]);
  });
});
