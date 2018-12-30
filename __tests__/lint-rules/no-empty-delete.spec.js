import lint from '../lint';

describe('no-empty-delete', () => {
  test('success', () => {
    const md = '~~hello~~';
    expect(lint(md)).toEqual([]);
  });

  test('fail', () => {
    const md = '# hello ~~~~world';
    expect(lint(md)).toEqual([{
      level: 'error',
      start: {
        line: 1,
        column: 9,
      },
      end: {
        line: 1,
        column: 13,
      },
      text: '',
      type: 'no-empty-delete'
    }]);
  });
});
