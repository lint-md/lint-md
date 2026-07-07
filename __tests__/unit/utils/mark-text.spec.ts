import { markText } from '../../../src/utils/mark-text';

describe('markText', () => {
  it('should handle empty string', () => {
    expect(markText('')).toBe('');
  });

  it('should mark single numeric character', () => {
    expect(markText('0')).toBe('N');
    expect(markText('1')).toBe('N');
    expect(markText('9')).toBe('N');
  });

  it('should mark single Chinese character', () => {
    expect(markText('你')).toBe('Z');
    expect(markText('好')).toBe('Z');
  });

  it('should mark single lowercase English character', () => {
    expect(markText('a')).toBe('A');
    expect(markText('m')).toBe('A');
    expect(markText('z')).toBe('A');
  });

  it('should mark single uppercase English character', () => {
    expect(markText('A')).toBe('A');
    expect(markText('Z')).toBe('A');
  });

  it('should mark space as dash', () => {
    expect(markText(' ')).toBe('-');
  });

  it('should mark punctuation as dash', () => {
    expect(markText('!')).toBe('-');
    expect(markText('@')).toBe('-');
    expect(markText('#')).toBe('-');
    expect(markText(',')).toBe('-');
    expect(markText('.')).toBe('-');
  });

  it('should mark mixed Chinese and English', () => {
    expect(markText('你好hello')).toBe('ZZAAAAA');
  });

  it('should mark mixed numbers and English', () => {
    expect(markText('123abc')).toBe('NNNAAA');
  });

  it('should mark mixed Chinese and numbers', () => {
    expect(markText('测试123')).toBe('ZZNNN');
  });

  it('should mark space-separated content', () => {
    expect(markText('a b c')).toBe('A-A-A');
  });

  it('should mark newline character', () => {
    expect(markText('a\nb')).toBe('A-A');
  });

  it('should mark tab character', () => {
    expect(markText('a\tb')).toBe('A-A');
  });

  it('should mark README example', () => {
    expect(markText('你好世界 hello world!!!')).toBe('ZZZZ-AAAAA-AAAAA---');
  });

  it('should mark long Chinese text', () => {
    expect(markText('中文测试')).toBe('ZZZZ');
  });

  it('should mark special characters', () => {
    expect(markText('()[]{}')).toBe('------');
  });
});
