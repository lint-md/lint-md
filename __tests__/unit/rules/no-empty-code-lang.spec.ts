import { createFixer } from '../../utils/test-utils';
import { lintMarkdownInternal } from '../../../src/core/lint-markdown';
import noEmptyCodeLang from '../../../src/rules/no-empty-code-lang';
import noEmptyCode from '../../../src/rules/no-empty-code';

const fixer = createFixer([{
  rule: noEmptyCodeLang
}]);

describe('test no-empty-code-lang', () => {
  test('no fix applied', () => {
    const md = '```js\n'
      + 'const a = 1;\n'
      + '```';

    const { fixedResult, lintResult } = fixer(md);

    expect(fixedResult?.result).toBe(md);
    expect(lintResult.reports.length).toStrictEqual(0);
  });

  test('fix applied', () => {
    const md = '```\n'
      + 'const b = 2;\n'
      + '```';

    const { fixedResult, lintResult } = fixer(md);

    expect(fixedResult?.result).toBe('```plain\n'
      + 'const b = 2;\n'
      + '```');
    expect(lintResult.reports.length).toStrictEqual(1);
  });

  // 回归：旧实现写死 `start.offset + 3`，围栏不是 3 个反引号时会改坏文档。
  test.each([
    ['three backticks', '```'],
    ['three tildes', '~~~'],
    ['four backticks', '````'],
    ['four tildes', '~~~~'],
    ['indented backticks', '   ```'],
    ['indented tildes', '  ~~~'],
    ['opening line trailing spaces', '```   ']
  ])('test %s fence keeps its length and closing fence', (_name, opening) => {
    const md = [opening, 'const c = 3;', opening].join('\n');

    const { fixedResult, lintResult } = fixer(md);

    // 语言追加在 opening 行行尾，围栏本身不被改写。
    expect(fixedResult?.result).toBe([`${opening}plain`, 'const c = 3;', opening].join('\n'));
    expect(lintResult.reports.length).toStrictEqual(1);
  });

  test('test CRLF opening line', () => {
    const md = ['```', 'const d = 4;', '```'].join('\r\n');

    const { fixedResult, lintResult } = fixer(md);

    // 插入点必须停在 \r 之前，否则语言会插到行结束符后面。
    expect(fixedResult?.result).toBe(['```plain', 'const d = 4;', '```'].join('\r\n'));
    expect(lintResult.reports.length).toStrictEqual(1);
  });

  test.each([
    ['blockquote', '> ```\n> const value = 1;\n> ```', '> ```plain\n> const value = 1;\n> ```'],
    ['list', '- item\n    ```\n    const value = 1;\n    ```', '- item\n    ```plain\n    const value = 1;\n    ```']
  ])('fixes a fenced code block in a %s', (_name, md, expected) => {
    const { fixedResult, lintResult } = fixer(md);

    expect(fixedResult?.result).toBe(expected);
    expect(lintResult.reports.length).toStrictEqual(1);
  });

  // 回归：旧实现改坏 opening 行后，文档里会多出一个空代码块。
  // no-empty-code 会删掉这个空块，闭合围栏随之丢失。
  test('test the fix does not let no-empty-code drop the closing fence', () => {
    const md = ['````', 'const e = 5;', '````'].join('\n');

    const { fixedResult } = lintMarkdownInternal(md, [
      { rule: noEmptyCodeLang },
      { rule: noEmptyCode }
    ], true);

    expect(fixedResult?.result).toBe(['````plain', 'const e = 5;', '````'].join('\n'));
  });

  // indented code 没有 info string，语言没有语法位置可放，因此本规则不适用。
  // 旧实现把 plain 插进代码内容里。只改插入点的实现会把 plain 追加到行尾，
  // 该节点仍是 indented code 且 lang 为空，于是每轮再报一次，
  // 直到 MAX_LINT_AND_FIX_CALL_TIMES 用完。
  test('does not auto-fix indented code blocks', () => {
    const md = '    const a = 1;';

    const { fixedResult, lintResult } = fixer(md);

    expect(fixedResult?.result).toBe(md);
    expect(lintResult.reports.length).toStrictEqual(0);
  });

  test.each([
    ['four spaces', '    const a = 1;'],
    ['tab', '\tconst a = 1;'],
    ['blockquote', '>     const a = 1;'],
    ['list item', '-     const a = 1;'],
    ['nested blockquote', '>>     const a = 1;'],
    ['backtick content', '    ```'],
    ['tilde content', '    ~~~'],
    ['multiple lines', '    const b = 2;\n\n    const c = 3;']
  ])('test %s indented code is not reported', (_name, md) => {
    const { fixedResult, lintResult } = fixer(md);

    expect(fixedResult?.result).toBe(md);
    expect(lintResult.reports.length).toStrictEqual(0);
  });
});
