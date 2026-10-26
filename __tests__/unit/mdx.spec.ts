import { fixMdx, lintMdx } from '../../src/mdx';
import { RULE_SEVERITY } from '../../src';
import type { LintMdRule } from '../../src';

const input = 'export const value = 1\n\n<Card title="ABC中文">中文ABC中文 {value}</Card>';
const rules = { 'space-around-alphabet': RULE_SEVERITY.ERROR };

describe('MDX entry', () => {
  test('keeps blank lines in ESM and JSX while fixing Markdown outside them', () => {
    const source = [
      'export const message = `第一行',
      '',
      '',
      '第三行`',
      '',
      '',
      '',
      '# 中文English标题',
      '',
      '',
      '',
      '<Card label="保留  两个空格">',
      '中文ABC正文',
      '',
      '',
      '第三行',
      '</Card>'
    ].join('\n');
    const expected = [
      'export const message = `第一行',
      '',
      '',
      '第三行`',
      '',
      '# 中文 English 标题',
      '',
      '<Card label="保留  两个空格">',
      '中文 ABC 正文',
      '',
      '',
      '第三行',
      '</Card>'
    ].join('\n');
    const result = fixMdx(source, {
      rules: {
        'no-multiple-blank-lines': RULE_SEVERITY.ERROR,
        ...rules
      }
    });

    expect(result.fixedResult.result).toBe(expected);
    expect(result.remainingDiagnostics).toHaveLength(0);
  });

  test('keeps blank lines in flow expressions', () => {
    const source = [
      '{`第一行',
      '',
      '',
      '第三行`}',
      '',
      '',
      '',
      '正文'
    ].join('\n');
    const expected = [
      '{`第一行',
      '',
      '',
      '第三行`}',
      '',
      '正文'
    ].join('\n');
    const result = fixMdx(source, {
      rules: { 'no-multiple-blank-lines': RULE_SEVERITY.ERROR }
    });

    expect(result.fixedResult.result).toBe(expected);
    expect(result.remainingDiagnostics).toHaveLength(0);
  });

  test('lints Markdown text inside JSX without reporting code or attributes', () => {
    const result = lintMdx(input, { rules });

    expect(result.diagnostics).toHaveLength(2);
    expect(result.diagnostics.every(item => item.ruleId === 'space-around-alphabet')).toBe(true);
    expect(result.diagnostics[0].range?.start.offset).toBe(input.indexOf('中文ABC中文') + 1);
    expect(result.fixedResult).toBeNull();
  });

  test('fixes MDX text and verifies the final MDX document', () => {
    const mdxRule: LintMdRule = {
      meta: { name: 'mdx-element' },
      create: context => ({
        mdxJsxTextElement: node => context.report({
          loc: node.position,
          message: 'MDX element remains'
        })
      })
    };
    const result = fixMdx(input, {
      rules: {
        ...rules,
        'mdx-element': [mdxRule, RULE_SEVERITY.ERROR, {}]
      }
    });

    expect(result.fixedResult.result).toBe(
      'export const value = 1\n\n<Card title="ABC中文">中文 ABC 中文 {value}</Card>'
    );
    expect(result.fixedResult.rounds).toBeGreaterThan(1);
    expect(result.initialDiagnostics.map(item => item.ruleId)).toContain('mdx-element');
    expect(result.remainingDiagnostics.map(item => item.ruleId)).toEqual(['mdx-element']);
    expect(result.complete).toBe(true);
  });
});
