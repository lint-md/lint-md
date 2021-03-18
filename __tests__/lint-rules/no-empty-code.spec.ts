import { lint } from '../../src';

describe('no-empty-code', () => {
  test('success', () => {
    const md = '```js\n' +
               'const a = 0;\n' +
               '```';
    expect(lint(md)).toEqual([]);
  });

  test('fail', () => {
    const md = '```js\n' +
               '```';
    expect(lint(md)).toEqual([{
      level: 'error',
      start: {
        line: 1,
        column: 1,
      },
      end: {
        line: 2,
        column: 4,
      },
      text: '',
      type: 'no-empty-code'
    }]);
  });
});
