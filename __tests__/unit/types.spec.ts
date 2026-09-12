import { lintMarkdown } from '../../src';
import type {
  LintMdFixResult,
  LintMdLintResult,
  TextRange
} from '../../src/types';

describe('TextRange', () => {
  test('requires exactly two offsets', () => {
    expect([0, 1] satisfies TextRange).toEqual([0, 1]);

    // TextRange requires exactly two offsets.
    // @ts-expect-error A one-offset range is invalid.
    expect([0] satisfies TextRange).toEqual([0]);

    // @ts-expect-error A three-offset range is invalid.
    expect([0, 1, 2] satisfies TextRange).toEqual([0, 1, 2]);
  });
});

describe('lintMarkdown return types', () => {
  test('infers options calls as lint-only results', () => {
    const result: LintMdLintResult = lintMarkdown('text', { rules: {} });
    const defaultResult: LintMdLintResult = lintMarkdown('text');

    expect(result.fixedResult).toBeNull();
    expect(defaultResult.fixedResult).toBeNull();

    // The options API never returns a fix result.
    // @ts-expect-error The options overload returns LintMdLintResult.
    const fixResult: LintMdFixResult = lintMarkdown('text', { rules: {} });
    expect(fixResult).toBeDefined();
  });

  test('keeps precise legacy boolean return types', () => {
    const lintResult: LintMdLintResult = lintMarkdown('text', {}, false);
    const fixResult: LintMdFixResult = lintMarkdown('text', {}, true);

    expect(lintResult.fixedResult).toBeNull();
    expect(fixResult.fixedResult).not.toBeNull();
  });
});
