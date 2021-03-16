import { fix } from '../../src';

describe('space-round-number', () => {
  test('no fix', () => {
    const md = `晚上天气 16 度。`;
    expect(fix(md)).toBe(md);
  });

  test('fix', () => {
    const md = `晚上天气 16度。`;
    expect(fix(md)).toBe('晚上天气 16 度。');
  });

  test('example', () => {
    const md = '今天（4月23日）是世界读书日，[语雀](https://yuque.com/)选在今天放开注册，不再需要邀请码，用户可以直接注册，跟阿里的正式员工一样使用所有功能。';
    expect(fix(md)).toBe('今天（4 月 23 日）是世界读书日，[语雀](https://yuque.com/)选在今天放开注册，不再需要邀请码，用户可以直接注册，跟阿里的正式员工一样使用所有功能。');
  });
});
