import { fix } from '../../src';

describe('no-empty-list', () => {
  test('no fix', () => {
    const md = '1.success';
    expect(fix(md)).toBe(md);
  });

  test('fix', () => {
    const md = '1. hello\n' +
               '2.';
    expect(fix(md)).toBe('1. hello');
  });
});
