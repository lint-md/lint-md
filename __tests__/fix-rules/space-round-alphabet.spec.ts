import { fix } from '../../src';

describe('space-round-alphabet', () => {
  test('no fix', () => {
    const md = `你好 world.`;
    expect(fix(md)).toBe(md);
  });

  test('fix', () => {
    const md = `你好world新年好.`;
    expect(fix(md)).toBe('你好 world 新年好.');
  });
});
