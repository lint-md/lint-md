import { createFixer } from '../../utils/test-utils';
import noEmptyBlockquote from '../../../src/rules/no-empty-blockquote';

const fixer = createFixer([{
  rule: noEmptyBlockquote
}]);

describe('test no-empty-blockquote', () => {
  test('fix applied', () => {
    const md = `
> 1233

> 

>

>`;
    const { fixedResult, lintResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(3);
    expect(fixedResult.result.trim()).toStrictEqual(`> 1233`);
  });
});
