import { fix } from '../src';

describe('test cases lint and fix', () => {
  test('front matter yml markdown (lint pass)', () => {
    const md = '---\n' +
      'categories:\n' +
      '    - Code\n' +
      'tags:\n' +
      '    - Java\n' +
      '    - IDEA\n' +
      '    - Spring Boot\n' +
      '---\n# hello world';
    expect(fix(md)).toStrictEqual(md);
  })

  test('front matter yml markdown (lint error)', () => {
    const md = '---\n' +
      'categories:\n' +
      '    - Code\n' +
      'tags:\n' +
      '    - Java\n' +
      '    - IDEA\n' +
      '    - Spring Boot\n' +
      '---\n# 你好!!!';

    // 标题后的感叹号被移除（中文标题不加标点）
    expect(fix(md)).toStrictEqual(md.slice(0, md.length - 3));
  })
});