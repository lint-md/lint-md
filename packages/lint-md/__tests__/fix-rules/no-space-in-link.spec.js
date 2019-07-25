import fix from '../fix';

describe('no-space-in-link', () => {
  test('no fix', () => {
    const md = `[hello world](https://atool.vip)`;
    expect(fix(md)).toBe(md);
  });

  test('fix', () => {
    const md = `[ hello, ~~world~~ ](https://atool.vip)`;
    expect(fix(md)).toBe('[hello, ~~world~~](https://atool.vip)');
  });
});
