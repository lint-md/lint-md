import { lintMarkdown, toALEOutput } from '../../src';
import type { LintDiagnostic } from '../../src/types';

describe('diagnostics', () => {
  describe('diagnostics field in lintMarkdown()', () => {
    test('returns diagnostics array when issues found', () => {
      const markdown = '中文English 123';
      const result = lintMarkdown(markdown, {}, false);

      expect(result.diagnostics).toBeDefined();
      expect(result.diagnostics.length).toBeGreaterThan(0);
    });

    test('diagnostics item matches LintDiagnostic shape', () => {
      const markdown = '中文English 123';
      const result = lintMarkdown(markdown, {
        'space-around-alphabet': 2
      }, false);

      const d = result.diagnostics[0];
      expect(typeof d.line).toBe('number');
      expect(typeof d.column).toBe('number');
      expect(typeof d.ruleId).toBe('string');
      expect(typeof d.message).toBe('string');
      expect(typeof d.severity).toBe('number');
    });

    test('returns empty diagnostics array when no issues found', () => {
      const markdown = '# Hello World\n\nThis is clean.';
      const result = lintMarkdown(markdown, {}, false);

      expect(result.diagnostics).toEqual([]);
    });

    test('lintResult field is unchanged (backward compat)', () => {
      const markdown = '中文English 123';
      const result = lintMarkdown(markdown, {}, false);

      expect(result.lintResult).toBeDefined();
      expect(result.lintResult.length).toBeGreaterThan(0);
      expect(result.lintResult[0]).toHaveProperty('loc');
      expect(result.lintResult[0]).toHaveProperty('message');
      expect(result.lintResult[0]).toHaveProperty('name');
      expect(result.lintResult[0]).toHaveProperty('content');
      expect(result.lintResult[0]).toHaveProperty('severity');
    });
  });

  describe('toALEOutput()', () => {
    test('formats diagnostics in ALE-compatible format', () => {
      const diagnostics: LintDiagnostic[] = [
        { line: 1, column: 3, ruleId: 'space-around-alphabet', message: '中英文之间需要添加空格', severity: 2 },
        { line: 1, column: 12, ruleId: 'space-around-number', message: '中文与数字之间需要添加空格', severity: 1 }
      ];
      const output = toALEOutput(diagnostics, '/tmp/test.md');

      expect(output).toContain('/tmp/test.md:1:3: E space-around-alphabet: 中英文之间需要添加空格');
      expect(output).toContain('/tmp/test.md:1:12: W space-around-number: 中文与数字之间需要添加空格');
    });

    test('returns empty string for empty diagnostics', () => {
      expect(toALEOutput([], 'test.md')).toBe('');
    });
  });
});
