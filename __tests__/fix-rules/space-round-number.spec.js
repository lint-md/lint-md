import fix from '../fix';

describe('space-round-number', () => {
  test('no fix', () => {
    const md = `晚上天气 16 度。`;
    expect(fix(md)).toBe(md);
  });

  test('fix', () => {
    const md = `晚上天气 16度。`;
    expect(fix(md)).toBe('晚上天气 16 度。');
  });
});
