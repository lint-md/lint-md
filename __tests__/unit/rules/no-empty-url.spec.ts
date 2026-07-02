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
    const { lintResult, fixedResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(1);
    expect(fixedResult?.result).toStrictEqual('快看看：![JavaScript 高级程序设计](https://example.com)');
  });

  test('fix applied (链接全部为空格)', () => {
    const md = '快看看：![JavaScript 高级程序设计](    )';
    const { lintResult, fixedResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(1);
    expect(fixedResult?.result).toStrictEqual('快看看：![JavaScript 高级程序设计](https://example.com)');
  });

  test('fix applied (混合场景：合法 URL 和空 URL 并存)', () => {
    const md = '[合法链接](https://example.com) 和 [空链接]()';
    const { lintResult, fixedResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(1);
    expect(fixedResult?.result).toStrictEqual('[合法链接](https://example.com) 和 [空链接](https://example.com)');
  });

  test('fix applied (多段落中的 link)', () => {
    const md = '第一段。\n\n[空链接]()\n\n第二段。';
    const { lintResult, fixedResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(1);
    expect(fixedResult?.result).toStrictEqual('第一段。\n\n[空链接](https://example.com)\n\n第二段。');
  });
});
