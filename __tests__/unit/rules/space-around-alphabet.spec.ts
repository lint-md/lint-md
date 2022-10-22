import { createFixer } from '../../utils/test-utils';
import spaceAroundAlphabet from '../../../src/rules/space-around-alphabet';

const fixer = createFixer([{
  rule: spaceAroundAlphabet
}]);

//language=markdown
const markdownToCheck = `
一般来说，浏览器侧的异常分为两种类型：
- JavaScript错误，一般来自用户的代码。
- 静态资源错误，他们可能来自：
  - 通过XMLHttpRequest、Fetch()的方式来请求的http资源。
  - 利用 \`<img/>\` \`<script/>\` \`<video/>\` \`<audio/>\` \`<iframe/>\` 等标签加载的资源。
  - 通过创建实例的方式，例如new Image() 等代码来实现初始化。
`;

//language=markdown
const fixedMarkdownToCheck = `
一般来说，浏览器侧的异常分为两种类型：
- JavaScript 错误，一般来自用户的代码。
- 静态资源错误，他们可能来自：
  - 通过 XMLHttpRequest、Fetch()的方式来请求的 http 资源。
  - 利用 \`<img/>\` \`<script/>\` \`<video/>\` \`<audio/>\` \`<iframe/>\` 等标签加载的资源。
  - 通过创建实例的方式，例如 new Image() 等代码来实现初始化。
`;

describe('test space-around-alphabet', () => {
  test('fix applied', () => {
    const { fixedResult, lintResult } = fixer(markdownToCheck);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(5);
    expect(fixedResult?.result).toStrictEqual(fixedMarkdownToCheck);
  });
});
