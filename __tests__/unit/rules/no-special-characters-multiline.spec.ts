import { createFixer } from '../../utils/test-utils';
import noSpecialCharacters from '../../../src/rules/no-special-characters';

const fixer = createFixer([{
  rule: noSpecialCharacters
}]);

// U+200A (hair space) - one of the special characters this rule detects
const HAIR_SPACE = '\u200A';

describe('test no-special-characters multi-line', () => {
  test('reports correct line for special char on second line', () => {
    const md = `第一行\n第二行有${HAIR_SPACE}空格`;
    const { lintResult } = fixer(md);
    const reports = lintResult.ruleManager.getReportData();
    expect(reports.length).toStrictEqual(1);
    expect(reports[0].loc.start.line).toStrictEqual(2);
  });

  test('reports correct line for special char on third line', () => {
    const md = `第一行\n第二行\n第三行有${HAIR_SPACE}空格`;
    const { lintResult } = fixer(md);
    const reports = lintResult.ruleManager.getReportData();
    expect(reports.length).toStrictEqual(1);
    expect(reports[0].loc.start.line).toStrictEqual(3);
  });

  test('reports correct column for special char on second line', () => {
    const md = `第一行\n第二行有${HAIR_SPACE}空格`;
    const { lintResult } = fixer(md);
    const reports = lintResult.ruleManager.getReportData();
    expect(reports[0].loc.start.column).toStrictEqual(5);
  });
});
