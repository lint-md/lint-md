const lint = require('../lint');

describe('space-round-number', () => {
  test('success', () => {
    const md = `晚上天气 16 度。`;
    expect(lint(md)).toEqual([]);
  });

  test('fail', () => {
    const md = `晚上天气 16度。`;
    expect(lint(md)).toEqual([{
      column: 8,
      level: 'error',
      line: 1,
      text: 'No space between Chinese and alphabet / number: 晚上天气 16度。',
      type: 'space-round-number'
    }]);
  });
});
