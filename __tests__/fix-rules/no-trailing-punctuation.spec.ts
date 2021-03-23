import { fix } from '../../src';

describe('no-trailing-punctuation', () => {
  test('success', () => {
    const md = `## header 2`;
    expect(fix(md)).toBe(md);
  });

  test('fail', () => {
    const md = `### header 3~~!~~**.**\`。`;
    // expect(lint(md)).toEqual([]);
    expect(fix(md)).toBe('### header 3');
  });
});
