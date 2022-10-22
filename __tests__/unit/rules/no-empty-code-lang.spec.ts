import { createFixer } from '../../utils/test-utils';
import noEmptyCodeLang from '../../../src/rules/no-empty-code-lang';

const fixer = createFixer([{
  rule: noEmptyCodeLang
}]);

describe('test no-empty-code-lang', () => {
  test('no fix applied', () => {
    const md = '```js\n' +
      'const a = 1;\n' +
      '```';

    const { fixedResult, lintResult } = fixer(md);

    expect(fixedResult?.result).toBe(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(0);
  });

  test('fix applied', () => {
    const md = '```\n' +
      'const b = 2;\n' +
      '```';

    const { fixedResult, lintResult } = fixer(md);

    expect(fixedResult?.result).toBe('```plain\n' +
      'const b = 2;\n' +
      '```');
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(1);
  });
});
