import { Fix } from 'packages/core/src/types';
import { applyFix } from '../../src/utils/apply-fix';

describe('test apply fix', () => {
  test('test when fixes is empty', () => {
    expect(applyFix('hello world', []).result).toStrictEqual('hello world');
  });

  test('test when fixes in only one range', () => {
    const content = 'hello world! Do you like JavaScript?';
    expect(content[25]).toStrictEqual('J');
    expect(content[35]).toStrictEqual('?');
    const fixes: Fix[] = [
      {
        text: 'TypeScript',
        range: [25, 35]
      }
    ];
    expect(applyFix(content, fixes).result).toStrictEqual('hello world! Do you like TypeScript?');
  });

  test('test when fixes in different range and they are not overlapped', () => {
    const content = 'hello world! Do you like JavaScript?';
    const fixes: Fix[] = [
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
    const fixes: Fix[] = [
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
        'range': [
          1,
          3
        ],
        'text': '不太喜欢'
      },
      {
        'range': [
          1,
          3
        ],
        'text': '不怎么喜欢'
      }
    ]);

  });

  test('test the fixes will be sorted by range', () => {
    const content = 'hello world! Do you like JavaScript?';
    const fixes: Fix[] = [
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
        'range': [
          25,
          35
        ],
        'text': 'TypeScript'
      },
      {
        'range': [
          12,
          12
        ],
        'text': '     '
      },
      {
        'range': [
          0,
          0
        ],
        'text': 'TIP: '
      },
      {
        'range': [
          0,
          5
        ],
        'text': 'world'
      }
    ]);
    expect(applyFix(content, fixes).result).toStrictEqual('TIP: hello world!      Do you like TypeScript?');
  });

  test('test illegal fix range', () => {
    const content = 'hello world! Do you like JavaScript?';
    const fixes: Fix[] = [
      {
        text: 'TypeScript',
        range: [222, 10]
      }
    ];
    expect(applyFix(content, fixes).result).toStrictEqual(content);
    expect(applyFix(content, fixes).notAppliedFixes.length).toStrictEqual(0);
  });
});
