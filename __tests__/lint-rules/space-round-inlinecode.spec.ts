import { lint } from '../../src';

describe('space-round-inlinecode', () => {
  test('lint success when space around inline code', () => {
    const cases = [
      '你好 `world` 世界',
      '你好 `world`',
      '`world` 世界',
      '`world`',
      '``world``',
      '![img](img) `code`'
    ];
    cases.forEach(c => {
      expect(lint(c)).toStrictEqual([]);
    });
  });

  test('lint fail when no space around for right error', () => {
    const md = '你好 `world`世界';
    expect(lint(md)).toEqual([
      {
        end: {
          column: 11,
          line: 1
        },
        level: 'error',
        start: {
          column: 4,
          line: 1
        },
        text: '`world` ',
        type: 'space-round-inlinecode'
      }
    ]);
  });

  test('lint fail when no space around for left error', () => {
    const md = '你好`world` 世界';
    expect(lint(md)).toEqual([
      {
        end: {
          column: 10,
          line: 1
        },
        level: 'error',
        start: {
          column: 3,
          line: 1
        },
        text: ' `world`',
        type: 'space-round-inlinecode'
      }
    ]);
  });

  test('lint fail when no space around with no-text node like image', () => {
    const md = '![img](img)`code`';
    expect(lint(md)).toEqual([
      {
        end: {
          column: 18,
          line: 1
        },
        level: 'error',
        start: {
          column: 12,
          line: 1
        },
        text: ' `code`',
        type: 'space-round-inlinecode'
      }
    ]);
  });

});
