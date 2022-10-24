import { lintMarkdownInternal } from '../../src';
import noEmptyCode from '../../src/rules/no-empty-code';
import { getExample } from '../utils/test-utils';
import { runLint } from '../../src/core/run-lint';
import { lintMarkdown } from '../../src/core/lint-markdown';

describe('test core methods for lint-markdown', () => {
  test('test runLint() to lint source', () => {
    const lintResult = runLint(`# Hello

Some **importance**, and \`code\`.

\`\`\`javascript

\`\`\``, [
      {
        rule: noEmptyCode
      }
    ]);

    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(1);
    const res = lintResult.ruleManager.getReportData().pop();
    expect(res?.message).toStrictEqual('[lint-md] 代码块内容不能为空，请删除空的代码块，或者填充代码内容');
  });

  test('test lintAndFixInternal() to lint or fix markdown source', () => {
    const res = lintMarkdownInternal(`# Hello

Some **importance**, and \`code\`.

\`\`\`javascript

\`\`\``, [
      {
        rule: noEmptyCode
      }
    ], true);

    expect(res.fixedResult?.notAppliedFixes).toStrictEqual([]);
    expect(res.fixedResult?.result).toMatchSnapshot();
  });

  test('test lintMarkdown() to lint or fix markdown source', () => {
    const example = getExample('docs-for-all-rules');
    const res = lintMarkdown(example);

    expect(res.fixedResult?.result).toMatchSnapshot();
  });
});
