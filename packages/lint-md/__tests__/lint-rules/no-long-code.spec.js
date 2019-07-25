import lint from '../lint';

describe('no-long-code', () => {
  test('success', () => {
    const md = [
      '```js',
      'console.log("this is a short line");',
      'console.log("with multiple lines");',
      '```',
    ].join('\n');

    expect(lint(md)).toEqual([]);
  });

  test('fail', () => {
    const longCode = 'console.log("very long long long long long long long long long long long long long long long long long sentence");';
    const md = [
      '```js',
      longCode,
      '```',
    ].join('\n');

    expect(lint(md)).toEqual([
      {
        level: 'error',
        start: {
          line: 2,
          column: 1,
        },
        end: {
          line: 2,
          column: longCode.length + 1,
        },
        text: `line with ${longCode.length} characters exceeds code max length 100`,
        type: 'no-long-code'
      }
    ]);
  });

  test('fail with length configured', () => {
    const code = 'console.log("hello world");';
    const md = [
      '```js',
      code,
      '```',
    ].join('\n');

    expect(lint(md, {
      'no-long-code': [2, {
        length: 10,
      }],
    })).toEqual([
      {
        level: 'error',
        start: {
          line: 2,
          column: 1,
        },
        end: {
          line: 2,
          column: code.length + 1,
        },
        text: `line with ${code.length} characters exceeds code max length 10`,
        type: 'no-long-code',
      },
    ]);
  });

  test('fail on every long line', () => {
    const code = 'console.log("hello world");';
    const md = [
      '```js',
      code,
      'short',
      code,
      'short',
      '```',
    ].join('\n');

    expect(lint(md, {
      'no-long-code': [2, {
        length: 10,
      }],
    })).toEqual([
      {
        level: 'error',
        start: {
          line: 2,
          column: 1,
        },
        end: {
          line: 2,
          column: code.length + 1,
        },
        text: `line with ${code.length} characters exceeds code max length 10`,
        type: 'no-long-code',
      },
      {
        level: 'error',
        start: {
          line: 4,
          column: 1,
        },
        end: {
          line: 4,
          column: code.length + 1,
        },
        text: `line with ${code.length} characters exceeds code max length 10`,
        type: 'no-long-code',
      },
    ]);
  });

  test('success with exclude lang configured', () => {
    const longCode = 'console.log("very long long long long long long long long long long long long long long long long long sentence");';
    const md = [
      '```js',
      longCode,
      '```',
    ].join('\n');

    expect(lint(md, {
      'no-long-code': [2, {
        exclude: ['js'],
      }],
    })).toEqual([]);
  });
});
