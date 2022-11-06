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
});
