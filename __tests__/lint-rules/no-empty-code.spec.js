import lint from '../lint';

describe('no-empty-code', () => {
  test('success', () => {
    let md = '```js\n' +
               'const a = 0;\n' +
               '```';
    expect(lint(md)).toEqual([]);

    md = '`const a = 0;`';
    expect(lint(md)).toEqual([]);
  });

  test('fail', () => {
    let md = '```js\n' +
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

    md = '``';
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
      type: 'no-empty-code'
    }]);
  });
});
