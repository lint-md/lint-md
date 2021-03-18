import { lint } from '../../src';

describe('no-empty-blockquote', () => {
  test('success', () => {
    const md = ` - right

> hello world!`;
    expect(lint(md)).toEqual([]);
  });

  test('fail', () => {
    const md = `- wrong

> `;
    expect(lint(md, { 'no-empty-blockquote': 1 })).toEqual([{
      level: 'warning',
      start: {
        line: 3,
        column: 1
      },
      end: {
        line: 3,
        column: 3
      },
      text: '',
      type: 'no-empty-blockquote'
    }]);
  });
});
