import { createFixer } from '../../utils/test-utils';
import spaceAroundNumber from '../../../src/rules/space-around-number';

const fixer = createFixer([{
  rule: spaceAroundNumber
}]);

//language=markdown
const markdownToCheck = `
33你好世界520 测试测试32123123
`;

//language=markdown
const fixedMarkdownToCheck = `
33 你好世界 520 测试测试 32123123
`;

describe('test space-around-number', () => {
  test('fix applied', () => {
    const { fixedResult, lintResult } = fixer(markdownToCheck);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(3);
    expect(fixedResult?.result).toStrictEqual(fixedMarkdownToCheck);
  });
});
