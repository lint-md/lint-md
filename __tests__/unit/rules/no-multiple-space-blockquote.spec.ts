import { createFixer } from '../../utils/test-utils';
import noMultipleSpaceBlockquote from '../../../src/rules/no-multiple-space-blockquote';

const fixer = createFixer([{
  rule: noMultipleSpaceBlockquote
}]);

describe('test no-multiple-space-blockquote', () => {
  test('fix applied (纯文本)', () => {
    const md = '>    1231231232313';
    const { fixedResult, lintResult } = fixer(md);
    expect(fixedResult?.result).toStrictEqual('> 1231231232313');
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(1);
  });

  test('fix applied (复杂孩子，大量空格)', () => {
    const md = '>    [1312313](13)';
    const { fixedResult, lintResult } = fixer(md);
    expect(fixedResult?.result).toStrictEqual('> [1312313](13)');
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(1);
  });

  test('fix applied (缺失空格)', () => {
    const md = '>[1312313](13)';
    const { fixedResult, lintResult } = fixer(md);
    expect(fixedResult?.result).toStrictEqual('> [1312313](13)');
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(1);
  });
});
