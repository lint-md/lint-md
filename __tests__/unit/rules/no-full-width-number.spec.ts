import { createFixer } from '../../utils/test-utils';
import noFullWidthNumber from '../../../src/rules/no-full-width-number';

const fixer = createFixer([{
  rule: noFullWidthNumber
}]);

describe('test no-full-width-number', () => {
  test('fix applied', () => {
    const md = `> 这件蛋糕只卖 １０００ 元。\n这个 １０ 哈哈`;

    const { fixedResult, lintResult } = fixer(md);
    expect(fixedResult?.result).toStrictEqual('> 这件蛋糕只卖 1000 元。\n这个 10 哈哈');
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(2);
  });
});
