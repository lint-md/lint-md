import { createFixer } from '../../utils/test-utils';
import noSpaceInLink from '../../../src/rules/no-space-in-link';

const fixer = createFixer([{
  rule: noSpaceInLink
}]);

describe('test no-space-in-link', () => {
  test('fix applied (复杂内容)', () => {
    const md = '[ JavaScript 高级程序设计, **前端** ](https://book.douban.com/subject/10546125)';
    const { fixedResult, lintResult } = fixer(md);
    expect(fixedResult?.result).toBe('[JavaScript 高级程序设计, **前端**](https://book.douban.com/subject/10546125)');
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(2);
  });

  test('fix applied (仅左侧)', () => {
    const md = '[       JavaScript 高级程序设计](https://book.douban.com/subject/10546125)';
    const { fixedResult, lintResult } = fixer(md);
    expect(fixedResult?.result).toBe('[JavaScript 高级程序设计](https://book.douban.com/subject/10546125)');
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(1);
  });

  test('fix applied (仅右侧)', () => {
    const md = '[JavaScript 高级程序设计    ](https://book.douban.com/subject/10546125)';
    const { fixedResult, lintResult } = fixer(md);
    expect(fixedResult?.result).toBe('[JavaScript 高级程序设计](https://book.douban.com/subject/10546125)');
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(1);
  });

  test('fix issue', () => {
    const md = 'only recalculate with [`hotReload` enabled](../../config/theme/basic.md#hotreload)';
    const { fixedResult, lintResult } = fixer(md);
    expect(fixedResult?.result).toStrictEqual('only recalculate with [`hotReload` enabled](../../config/theme/basic.md#hotreload)');
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(0);
  });
});
