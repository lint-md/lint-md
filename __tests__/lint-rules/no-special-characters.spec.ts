import { lint } from '../../src';

describe('no-special-characters', () => {
  test('success', () => {
    const md = '1.success';
    expect(lint(md)).toEqual([]);
  });

  test('fail', () => {
    const md = 'hello world, before here has a \b.';
    expect(lint(md)).toEqual([{
      level: 'error',
      start: {
        line: 1,
        column: 14,
      },
      end: {
        line: 1,
        column: 15,
      },
      text: `'orld, befor'`,
      type: 'no-special-characters'
    }]);
  });
});
