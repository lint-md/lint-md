import { createFixer } from '../../utils/test-utils';
import correctTitleTrailingPunctuation from '../../../src/rules/correct-title-trailing-punctuation';

const fixer = createFixer([{
  rule: correctTitleTrailingPunctuation
}]);


describe('test correct-title-trailing-punctuation', () => {
  test('fix applied (普通文本)', () => {
    const mdToFix = `
# 我爱前端！

## JavaScript 疑难杂症……

### 你真的懂 React 开发吗？

##### 这是个不符合规范的标题啦~
`;

    const fixedMd = `
# 我爱前端！

## JavaScript 疑难杂症……

### 你真的懂 React 开发吗？

##### 这是个不符合规范的标题啦
`

    const { fixedResult, lintResult } = fixer(mdToFix.trim());
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(1);
    expect(fixedResult.result).toStrictEqual(fixedMd.trim());
  });

  test('fix applied (复杂内容物)', () => {
    const { fixedResult, lintResult } = fixer(`# 这就是 ~~删除线~~ ![12312313](213213) **啦啦啦**<div>~~123123~~!<a>测试测试</a></div> [123123123~](12312313)`);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(1);
    expect(fixedResult.result).toStrictEqual(`# 这就是 ~~删除线~~ ![12312313](213213) **啦啦啦**<div>~~123123~~!<a>测试测试</a></div> [123123123](12312313)`);
  });
});
