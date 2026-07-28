import type { FixConfig } from '../../src/types';
import { applyFix } from '../../src/utils/apply-fix';

describe('test apply fix', () => {
  test('test when fixes is empty', () => {
    expect(applyFix('hello world', []).result).toStrictEqual('hello world');
  });

  test('test when fixes in only one range', () => {
    const content = 'hello world! Do you like JavaScript?';
    expect(content[25]).toStrictEqual('J');
    expect(content[35]).toStrictEqual('?');
    const fixes: FixConfig[] = [
      {
        text: 'TypeScript',
        range: [25, 35]
      }
    ];
    expect(applyFix(content, fixes).result).toStrictEqual('hello world! Do you like TypeScript?');
  });

  test('test when fixes in different range and they are not overlapped', () => {
    const content = 'hello world! Do you like JavaScript?';
    const fixes: FixConfig[] = [
      {
        text: 'TypeScript',
        range: [25, 35]
      },
      {
        text: '     ',
        range: [12, 12]
      }
    ];
    expect(applyFix(content, fixes).result).toStrictEqual('hello world!      Do you like TypeScript?');
  });

  test('test when fixes in different range and THEY ARE OVERLAPPED', () => {
    const content = '你喜欢哪一门编程语言? Python、JavaScript 还是 TypeScript?';
    const fixes: FixConfig[] = [
      {
        text: '最不喜欢',
        range: [1, 3]
      },
      {
        text: '不太喜欢',
        range: [1, 3]
      },
      {
        text: '不怎么喜欢',
        range: [1, 3]
      }
    ];

    expect(applyFix(content, fixes).result).toStrictEqual('你最不喜欢哪一门编程语言? Python、JavaScript 还是 TypeScript?');
    expect(applyFix(content, fixes).notAppliedFixes).toStrictEqual([
      {
        range: [
          1,
          3
        ],
        text: '不太喜欢'
      },
      {
        range: [
          1,
          3
        ],
        text: '不怎么喜欢'
      }
    ]);
  });

  test('applies adjacent replacement ranges in one round', () => {
    const fixes: FixConfig[] = [
      {
        text: 'B',
        range: [1, 2]
      },
      {
        text: 'C',
        range: [2, 3]
      }
    ];

    expect(applyFix('abcd', fixes)).toStrictEqual({
      result: 'aBCd',
      notAppliedFixes: []
    });
  });

  test('applies an insertion at the end of a replacement', () => {
    const fixes: FixConfig[] = [
      {
        text: 'B',
        range: [1, 2]
      },
      {
        text: '-',
        range: [2, 2]
      }
    ];

    expect(applyFix('abcd', fixes)).toStrictEqual({
      result: 'aB-cd',
      notAppliedFixes: []
    });
  });

  test('skips a truly overlapping replacement range', () => {
    const skippedFix: FixConfig = {
      text: 'Y',
      range: [2, 4]
    };
    const fixes: FixConfig[] = [
      {
        text: 'X',
        range: [1, 3]
      },
      skippedFix
    ];

    expect(applyFix('abcde', fixes)).toStrictEqual({
      result: 'aXde',
      notAppliedFixes: [skippedFix]
    });
  });

  test('keeps the first insertion at the same offset', () => {
    const skippedFix: FixConfig = {
      text: 'Y',
      range: [1, 1]
    };
    const fixes: FixConfig[] = [
      {
        text: 'X',
        range: [1, 1]
      },
      skippedFix
    ];

    expect(applyFix('abc', fixes)).toStrictEqual({
      result: 'aXbc',
      notAppliedFixes: [skippedFix]
    });
  });

  test('test the fixes will be sorted by range', () => {
    const content = 'hello world! Do you like JavaScript?';
    const fixes: FixConfig[] = [
      {
        text: 'TypeScript',
        range: [25, 35]
      },
      {
        text: '     ',
        range: [12, 12]
      },
      {
        text: 'TIP: ',
        range: [0, 0]
      },
      {
        text: 'world',
        range: [0, 5]
      }
    ];
    expect(fixes).toStrictEqual([
      {
        range: [
          25,
          35
        ],
        text: 'TypeScript'
      },
      {
        range: [
          12,
          12
        ],
        text: '     '
      },
      {
        range: [
          0,
          0
        ],
        text: 'TIP: '
      },
      {
        range: [
          0,
          5
        ],
        text: 'world'
      }
    ]);
    expect(applyFix(content, fixes).result).toStrictEqual('TIP: hello world!      Do you like TypeScript?');
  });

  test('test illegal fix range', () => {
    const content = 'hello world! Do you like JavaScript?';
    const fixes: FixConfig[] = [
      {
        text: 'TypeScript',
        range: [222, 10]
      }
    ];
    expect(applyFix(content, fixes).result).toStrictEqual(content);
    expect(applyFix(content, fixes).notAppliedFixes.length).toStrictEqual(0);
  });
});
