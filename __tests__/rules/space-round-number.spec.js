import lint from '../lint';

describe('space-round-number', () => {
  test('success', () => {
    const md = `晚上天气 16 度。`;
    expect(lint(md)).toEqual([]);
  });

  test('fail', () => {
    const md = `晚上天气 16度。`;
    expect(lint(md)).toEqual([{
      level: 'error',
      start: {
        line: 1,
        column: 8,
      },
      end: {
        line: 1,
        column: 9,
      },
      text: 'No space between Chinese and alphabet / number: 晚上天气 16度。',
      type: 'space-round-number'
    }]);
  });
});
