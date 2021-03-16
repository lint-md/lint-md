import { fix } from '../../src';

describe('no-space-in-emphasis', () => {
  test('no fix', () => {
    const md = `**hello, ~~world~~**`;
    expect(fix(md)).toBe(md);
  });

  test('fail', () => {
    const md = `** hello, ~~world~~ **`;
    expect(fix(md)).toBe('**hello, ~~world~~**');
  });
});
