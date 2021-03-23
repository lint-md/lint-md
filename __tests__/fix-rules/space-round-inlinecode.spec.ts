import { fix } from '../../src';

describe('space-round-inlinecode', () => {
  test('no fix', () => {
    const cases = [
      '你好 `world` 世界',
      '你好 `world`',
      '`world` 世界',
      '`world`',
      '``world``',
      '![img](img) `code`'
    ];
    cases.forEach(c => {
      expect(fix(c)).toStrictEqual(c);
    });
  });

  test('fix', () => {
    const dataToFix = [
      '你好 `world`世界',
      '你好`world`世界',
      '你好 `world`世界',
      '![img](img)`code`'
    ];
    expect(dataToFix.map(data => fix(data)))
      .toStrictEqual([
        '你好 `world` 世界',
        '你好 `world` 世界',
        '你好 `world` 世界',
        '![img](img) `code`'
      ]);
  });
});
