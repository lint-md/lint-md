const lint = require('../lint');

describe('space-round-alphabet', () => {
  test('success', () => {
    const md = `你好 world.`;
    expect(lint(md)).toEqual([]);
  });

  test('fail', () => {
    const md = `你好world.`;
    expect(lint(md)).toEqual([{
      level: 'error',
      start: {
        line: 1,
        column: 3,
      },
      end: {
        line: 1,
        column: 4,
      },
      text: 'No space between Chinese and alphabet / number: 你好world.',
      type: 'space-round-alphabet'
    }]);
  });
});
