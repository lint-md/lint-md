import { createFixer } from '../../utils/test-utils';
import spaceAroundAlphabet from '../../../src/rules/space-around-alphabet';

const fixer = createFixer([{
  rule: spaceAroundAlphabet
}]);

describe('test space-around-alphabet', () => {
  test('fix applied', () => {
    const content = '（有时称为 m\\-dots 或 m子域名）就是 - 托管在 website子域名中的的移动特定版本，通常是 `m` 子域名。';
    const { fixedResult, lintResult } = fixer(content);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(1);
    expect(fixedResult?.result).toStrictEqual('（有时称为 m-dots 或 m 子域名）就是 - 托管在 website 子域名中的的移动特定版本，通常是 `m` 子域名。');
  });

  test('fix applied (多个中英文边界)', () => {
    const content = '使用React开发Vue应用';
    const { fixedResult, lintResult } = fixer(content);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(1);
    expect(fixedResult?.result).toStrictEqual('使用 React 开发 Vue 应用');
  });

  test('fix applied (文本头部和尾部)', () => {
    const content = 'React开发';
    const { fixedResult, lintResult } = fixer(content);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(1);
    expect(fixedResult?.result).toStrictEqual('React 开发');
  });

  test('no fix applied (纯中文)', () => {
    const content = '这是纯中文内容';
    const { fixedResult, lintResult } = fixer(content);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(0);
    expect(fixedResult?.result).toStrictEqual(content);
  });

  test('no fix applied (纯英文)', () => {
    const content = 'This is pure English content';
    const { fixedResult, lintResult } = fixer(content);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(0);
    expect(fixedResult?.result).toStrictEqual(content);
  });

  test('no fix applied (已有空格)', () => {
    const content = '使用 React 开发 Vue 应用';
    const { fixedResult, lintResult } = fixer(content);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(0);
    expect(fixedResult?.result).toStrictEqual(content);
  });
});
