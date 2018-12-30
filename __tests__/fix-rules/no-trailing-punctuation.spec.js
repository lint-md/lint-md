import fix from '../fix';

describe('no-trailing-punctuation', () => {
  test('success', () => {
    const md = `## header 2`;
    expect(fix(md)).toBe(md);
  });

  test('fail', () => {
    const md = `### header 3~~!~~**.**\`。\``;
    expect(fix(md)).toBe('### header 3');
  });
});
