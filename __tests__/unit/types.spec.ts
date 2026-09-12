import { fixMarkdown, lintMarkdown } from '../../src';
import type {
  FixMarkdownResult,
  LintMarkdownResult,
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
    const result: LintMarkdownResult = lintMarkdown('text', { rules: {} });

    expect(result.fixedResult).toBeNull();
    expect(result.complete).toBe(true);

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
    expect(result.complete).toBeUndefined();
  });

  test('infers fixMarkdown results with required versioned diagnostics', () => {
    const result: FixMarkdownResult = fixMarkdown('text', { rules: {} });

    expect(result.initialDiagnostics).toBe(result.diagnostics);
    expect(result.complete).toBe(true);

    // Legacy overloads retain optional fields for 2.x compatibility.
    // @ts-expect-error Legacy lintMarkdown fix results are not precise.
    const legacyResult: FixMarkdownResult = lintMarkdown('text', {}, true);
    expect(legacyResult).toBeDefined();
  });
});

describe('complete result compatibility', () => {
  test('keeps legacy lint results compatible without complete', () => {
    const result: LintMdLintResult = {
      lintResult: [],
      diagnostics: [],
      summary: {
        errorCount: 0,
        warningCount: 0,
        fixableErrorCount: 0,
        fixableWarningCount: 0
      },
      fixableErrorCount: 0,
      fixableWarningCount: 0,
      executionErrors: [],
      fixedResult: null
    };

    expect(result.complete).toBeUndefined();
  });

  test('keeps legacy overloads on compatibility result types', () => {
    // @ts-expect-error Legacy lint calls do not guarantee complete.
    const lintResult: LintMarkdownResult = lintMarkdown('text', {}, false);
    // @ts-expect-error Legacy fix calls do not guarantee complete.
    const fixResult: FixMarkdownResult = lintMarkdown('text', {}, true);

    expect(lintResult).toBeDefined();
    expect(fixResult).toBeDefined();
  });
});
