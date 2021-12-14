import { isFunction } from 'lodash';
import { lintMarkdown } from '../../src/core/lint-markdown';
import noEmptyCode from '../../src/rules/no-empty-code';
import { lintAndFix } from '../../src/core/lint-and-fix';

describe('test core methods for lint-markdown', () => {
  test('test lintMarkdown() to lint source', () => {
    const lintResult = lintMarkdown(`# Hello

Some **importance**, and \`code\`.

\`\`\`javascript

\`\`\``, [
      noEmptyCode
    ]);

    expect(lintResult.ruleContext.getReportData().length).toStrictEqual(1);
    const res = lintResult.ruleContext.getReportData().pop();
    expect(isFunction(res.fix)).toBeTruthy();
    expect(res.message).toStrictEqual('[lint-md] 代码块内容不能为空，请删除空的代码块，或者填充代码内容');
  });

  test('test lintAndFix() to lint or fix markdown source', () => {
    const res = lintAndFix(`# Hello

Some **importance**, and \`code\`.

\`\`\`javascript

\`\`\``, [
      noEmptyCode
    ], true);

    expect(res.fixedResult.notAppliedFixes).toStrictEqual([]);
    expect(res.fixedResult.result).toMatchSnapshot();
  });
});
