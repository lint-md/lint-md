import { fixMarkdown, lintMarkdown } from '../../src';
import type {
  FixMarkdownResult,
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

    expect(result.fixedResult).toBeNull();

    // The options API never returns a fix result.
    // @ts-expect-error The options overload returns LintMdLintResult.
    const fixResult: LintMdFixResult = lintMarkdown('text', { rules: {} });
    expect(fixResult).toBeDefined();
  });

  test('keeps precise legacy return types', () => {
    const defaultResult: LintMdFixResult = lintMarkdown('text');
    const emptyRulesResult: LintMdFixResult = lintMarkdown('text', {});
    const lintResult: LintMdLintResult = lintMarkdown('text', {}, false);
    const fixResult: LintMdFixResult = lintMarkdown('text', {}, true);

    expect(defaultResult.fixedResult).not.toBeNull();
    expect(emptyRulesResult.fixedResult).not.toBeNull();
    expect(lintResult.fixedResult).toBeNull();
    expect(fixResult.fixedResult).not.toBeNull();
  });
});

describe('fix result compatibility', () => {
  test('allows legacy fix results without versioned diagnostics', () => {
    const summary = {
      errorCount: 0,
      warningCount: 0,
      fixableErrorCount: 0,
      fixableWarningCount: 0
    };
    const result: LintMdFixResult = {
      lintResult: [],
      diagnostics: [],
      summary,
      fixableErrorCount: 0,
      fixableWarningCount: 0,
      executionErrors: [],
      fixedResult: {
        result: 'text',
        notAppliedFixes: []
      }
    };

    expect(result.fixedResult.result).toBe('text');
  });

  test('infers fixMarkdown results with required versioned diagnostics', () => {
    const result: FixMarkdownResult = fixMarkdown('text', { rules: {} });

    expect(result.initialDiagnostics).toBe(result.diagnostics);

    // Legacy overloads retain optional fields for 2.x compatibility.
    // @ts-expect-error Legacy lintMarkdown fix results are not precise.
    const legacyResult: FixMarkdownResult = lintMarkdown('text', {}, true);
    expect(legacyResult).toBeDefined();
  });
});
