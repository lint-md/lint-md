import { fix } from '../../src';

describe('no-empty-blockquote', () => {
  test('no fix', () => {
    const md = ` - right
> hello world!`;
    expect(fix(md)).toBe(md);
  });

  test('fix', () => {
    const md = ` - right
> `;
    expect(fix(md)).toBe(` - right`);
  });
});
