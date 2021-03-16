import { fix } from '../../src';

describe('no-empty-delete', () => {
  test('no fix', () => {
    const md = '~~hello~~';
    expect(fix(md)).toBe(md);
  });

  test('fix', () => {
    const md = '# hello ~~~~world';
    expect(fix(md)).toBe('# hello world');
  });
});
