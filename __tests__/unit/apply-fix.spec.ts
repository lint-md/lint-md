import { type FixConfig, FixNotAppliedReason } from '../../src/types';
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
        text: '不太喜欢',
        reason: 'overlap'
      },
      {
        range: [
          1,
          3
        ],
        text: '不怎么喜欢',
        reason: 'overlap'
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

  test('an insertion blocks a replacement at the same offset', () => {
    const skippedFix: FixConfig = {
      text: 'C',
      range: [2, 3]
    };
    const fixes: FixConfig[] = [
      {
        text: 'B',
        range: [1, 2]
      },
      {
        text: '-',
        range: [2, 2]
      },
      skippedFix
    ];

    expect(applyFix('abcd', fixes)).toStrictEqual({
      result: 'aB-cd',
      notAppliedFixes: [{
        ...skippedFix,
        reason: 'same-offset'
      }]
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
      notAppliedFixes: [{
        ...skippedFix,
        reason: 'overlap'
      }]
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
      notAppliedFixes: [{
        ...skippedFix,
        reason: 'same-offset'
      }]
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

  test.each([
    { range: [-1, 1] },
    { range: [1, 99] },
    { range: [4, 4] },
    { range: [2, 1] },
    { range: [NaN, 1] },
    { range: [0, NaN] },
    { range: [Infinity, Infinity] },
    { range: [0, 1.5] }
  ])('records invalid fix range $range', ({ range }) => {
    const fix: FixConfig = { range: range as [number, number], text: 'X' };

    expect(applyFix('abc', [fix])).toStrictEqual({
      result: 'abc',
      notAppliedFixes: [{ ...fix, reason: FixNotAppliedReason.INVALID_RANGE }]
    });
  });

  test('invalid ranges do not change the order of valid fixes', () => {
    const invalid: FixConfig = { range: [NaN, 1], text: 'X' };

    expect(applyFix('abc', [
      { range: [2, 3], text: 'C' },
      invalid,
      { range: [0, 1], text: 'A' }
    ])).toStrictEqual({
      result: 'AbC',
      notAppliedFixes: [{ ...invalid, reason: FixNotAppliedReason.INVALID_RANGE }]
    });
  });

  test('accepts an insertion at the end of the content', () => {
    expect(applyFix('abc', [{ range: [3, 3], text: '!' }])).toStrictEqual({
      result: 'abc!',
      notAppliedFixes: []
    });
  });
});
