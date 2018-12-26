import fix from '../fix';

describe('no-empty-code', () => {
  test('no fix', () => {
    const md = ' - right\n```js\n const a = 1;\n```\n你好\n';
    expect(fix(md)).toBe(md);
  });

  test('fix', () => {
    const md = ' - right\n```js\n\n```\n你好\n';
    expect(fix(md)).toBe(' - right\n\n你好\n');
  });
});
