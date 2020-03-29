import lint from '../lint';

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
      text: `'你好world.'`,
      type: 'space-round-alphabet'
    }]);
  });
});
