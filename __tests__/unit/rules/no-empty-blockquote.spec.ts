import { createFixer } from '../../utils/test-utils';
import noEmptyBlockquote from '../../../src/rules/no-empty-blockquote';

const fixer = createFixer([{
  rule: noEmptyBlockquote
}]);

describe('test no-empty-blockquote', () => {
  test('fix applied', () => {
    const md = `
- right

> hello world!

- wrong

>`;
    const { fixedResult, lintResult } = fixer(md);
    expect(fixedResult?.result).toStrictEqual(`
- right

> hello world!

- wrong

`);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(1);
  });
});
