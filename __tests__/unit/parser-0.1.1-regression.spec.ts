import { lintMarkdown } from '../../src';

describe('parser 0.1.1 fix mode regression tests', () => {
  test('no-empty-code: fix convergence', () => {
    const md = '```js\n\n```\n\n正常文本。';
    const result = lintMarkdown(md, { 'no-empty-code': 2 }, true);

    expect(result.lintResult?.length).toBeGreaterThanOrEqual(1);
    expect(result.fixedResult?.result).toStrictEqual('\n\n正常文本。');
    expect(result.fixedResult?.notAppliedFixes).toStrictEqual([]);
  });

  test('no-empty-inline-code: fix convergence', () => {
    const md = '文本 ` ` 更多文本';
    const result = lintMarkdown(md, { 'no-empty-inline-code': 2 }, true);

    expect(result.lintResult?.length).toBeGreaterThanOrEqual(1);
    expect(result.fixedResult?.result).toStrictEqual('文本  更多文本');
    expect(result.fixedResult?.notAppliedFixes).toStrictEqual([]);
  });

  test('no-empty-url: fix convergence', () => {
    const md = '[空链接]() 和 ![空图片]()';
    const result = lintMarkdown(md, { 'no-empty-url': 2 }, true);

    expect(result.lintResult?.length).toBe(2);
    expect(result.fixedResult?.result).toStrictEqual(
      '[空链接](https://example.com) 和 ![空图片](https://example.com)'
    );
    expect(result.fixedResult?.notAppliedFixes).toStrictEqual([]);
  });

  test('no-space-in-inline-code: fix convergence', () => {
    const md = '代码 `  hello  ` 结束';
    const result = lintMarkdown(md, { 'no-space-in-inline-code': 2 }, true);

    expect(result.lintResult?.length).toBeGreaterThanOrEqual(1);
    expect(result.fixedResult?.result).toStrictEqual('代码 `hello` 结束');
    expect(result.fixedResult?.notAppliedFixes).toStrictEqual([]);
  });

  test('space-around-alphabet: fix convergence', () => {
    const md = '使用React和Vue开发';
    const result = lintMarkdown(md, { 'space-around-alphabet': 2 }, true);

    expect(result.lintResult?.length).toBeGreaterThanOrEqual(1);
    expect(result.fixedResult?.result).toStrictEqual('使用 React 和 Vue 开发');
    expect(result.fixedResult?.notAppliedFixes).toStrictEqual([]);
  });

  test('correct-title-trailing-punctuation: fix convergence', () => {
    const md = '# 标题内容。';
    const result = lintMarkdown(md, { 'correct-title-trailing-punctuation': 2 }, true);

    expect(result.lintResult?.length).toBeGreaterThanOrEqual(1);
    expect(result.fixedResult?.result).toStrictEqual('# 标题内容');
    expect(result.fixedResult?.notAppliedFixes).toStrictEqual([]);
  });

  test('multi-rule: combined fix convergence', () => {
    const md = `# 标题。

使用React开发。

\`\`\`js

\`\`\`

[空链接]()`;

    const result = lintMarkdown(md, {
      'correct-title-trailing-punctuation': 2,
      'space-around-alphabet': 2,
      'no-empty-code': 2,
      'no-empty-url': 2
    }, true);

    expect(result.lintResult?.length).toBeGreaterThanOrEqual(4);
    expect(result.fixedResult?.notAppliedFixes).toStrictEqual([]);

    const fixedLines = result.fixedResult?.result.split('\n');
    expect(fixedLines?.[0]).toStrictEqual('# 标题');
    expect(fixedLines?.[2]).toStrictEqual('使用 React 开发。');
    expect(result.fixedResult?.result).not.toContain('```js');
    expect(result.fixedResult?.result).toContain('https://example.com');
  });

  test('multi-rule: fix does not corrupt surrounding content', () => {
    const md = `# 正常标题

第一段内容。

\`\`\`python
print("hello")
\`\`\`

使用Node.js开发。

[合法链接](https://example.com)`;

    const result = lintMarkdown(md, {
      'space-around-alphabet': 2,
      'no-empty-code': 2
    }, true);

    expect(result.fixedResult?.result).toContain('# 正常标题');
    expect(result.fixedResult?.result).toContain('第一段内容。');
    expect(result.fixedResult?.result).toContain('```python\nprint("hello")\n```');
    expect(result.fixedResult?.result).toContain('使用 Node.js 开发。');
    expect(result.fixedResult?.result).toContain('[合法链接](https://example.com)');
  });
});
