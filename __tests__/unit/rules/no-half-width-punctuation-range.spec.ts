import { lintMarkdownInternal } from '../../../src/core/lint-markdown';
import noHalfWidthPunctuation from '../../../src/rules/no-half-width-punctuation';

const config = [{ rule: noHalfWidthPunctuation }];

describe('no-half-width-punctuation range-based report', () => {
  test.each([
    ['escaped parenthesis', '中文\\(test', '中文（test'],
    ['numeric entity', '中文&#40;test', '中文（test'],
  ])('%s is fixed correctly', (_name, input, expected) => {
    const first = lintMarkdownInternal(input, config, true);
    expect(first.fixedResult?.result).toBe(expected);

    const second = lintMarkdownInternal(first.fixedResult!.result, config, false);
    expect(second.lintResult.reports).toHaveLength(0);
  });

  test('does not remove only the backslash of an escape', () => {
    const result = lintMarkdownInternal('中文\\(test', config, true);
    expect(result.fixedResult?.result).not.toContain('\\(');
    expect(result.fixedResult?.result).not.toContain('中文test');
  });

  test('does not modify only part of a character entity', () => {
    const result = lintMarkdownInternal('中文&#40;test', config, true);
    expect(result.fixedResult?.result).not.toContain('&#');
    expect(result.fixedResult?.result).not.toContain('40;');
  });

  test('astral entity is preserved when not a punctuation target', () => {
    const result = lintMarkdownInternal('中文&Afr;test', config, false);
    expect(result.lintResult.reports).toHaveLength(0);
  });
});
