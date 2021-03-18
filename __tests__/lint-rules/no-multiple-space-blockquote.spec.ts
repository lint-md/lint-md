import { lint } from '../../src';

describe('no-multiple-space-blockquote', () => {
  test('success', () => {
    const md = `> hello world.`;
    expect(lint(md)).toEqual([]);
  });

  test('fail', () => {
    const md = `>  hello world.`;
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
      text: `' hello world...'`,
      type: 'no-multiple-space-blockquote'
    }]);
  });
});
