import { createFixer } from '../../utils/test-utils';
import noEmptyURL from '../../../src/rules/no-empty-url';

const fixer = createFixer([{
  rule: noEmptyURL
}]);

describe('test no-empty-url', () => {
  test('fix applied (for link)', () => {
    const md = '参考资料：[JavaScript 高级程序设计]()';
    const { lintResult, fixedResult } = fixer(md);
    expect(fixedResult?.result).toStrictEqual('参考资料：[JavaScript 高级程序设计](https://example.com)');
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(1);
  });

  test('fix applied (for image)', () => {
    const md = '快看看：![JavaScript 高级程序设计]()';
    const { lintResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(1);
  });

  test('fix applied (链接全部为空格)', () => {
    const md = '快看看：![JavaScript 高级程序设计](    )';
    const { lintResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(1);
  });
});
