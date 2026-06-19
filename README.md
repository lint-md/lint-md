# 🧹 lint-md/core

<p align="center">
  <a href="https://github.com/lint-md">
    <img width="100" src="https://avatars.githubusercontent.com/u/59811714">
  </a>
</p>


<p align="center">让中文 Markdown 写作更规范、更一致。</p>

<p align="center">Lint your Chinese Markdown for cleaner, more consistent writing.</p>

lint-md/core 是 lint-md 体系中的规则引擎核心，专注解决中文 Markdown 在团队协作中的一致性问题。它基于 AST 执行规则检查与自动修复，适用于文档、博客、知识库等长期维护场景。

[![stars](https://img.shields.io/github/stars/lint-md/lint-md?style=social)](https://github.com/lint-md/lint-md)
[![npm version](https://img.shields.io/npm/v/@lint-md/core.svg)](https://www.npmjs.com/package/@lint-md/core)
[![npm downloads](https://img.shields.io/npm/dm/@lint-md/core.svg)](https://www.npmjs.com/package/@lint-md/core)
[![license](https://img.shields.io/github/license/lint-md/lint-md)](https://github.com/lint-md/lint-md/blob/master/LICENSE)
[![codecov](https://codecov.io/gh/lint-md/lint-md/branch/master/graph/badge.svg)](https://codecov.io/gh/lint-md/lint-md)

## ✨ 特性

- **专注中文 Markdown 规范**：围绕中文写作场景设计规则与自动修复能力。
- **规则可配置、可扩展**：支持按规则粒度配置等级与参数，也支持扩展规则。
- **高性能处理能力**：4 vCPU 环境下，处理 1000 篇文档耗时 4s 内。
- **生态封装完善**：可接入 CLI、Prettier、ESLint、VSCode，也欢迎按业务场景继续封装。

## 🏗️ 架构原则

core 遵循「纯引擎 + 薄适配器」设计：

- **core 零 I/O**：只接受字符串入参，返回结构化数据，不读写文件、不直接输出到终端
- **集成做 I/O**：CLI、编辑器插件等适配器只负责输入输出和格式转换，不包含规则逻辑
- **标准诊断**：`LintDiagnostic` 统一诊断格式，core 提供格式转换器（`toALEOutput`），适配器无需自行实现映射

## 🚀 快速使用

从 API 到结果处理，核心只需要一个方法即可完成 lint/fix。当前对外仅提供 **1 个核心 API**：`lintMarkdown`。

```ts
lintMarkdown(markdown: string, rules?: LintMdRulesConfig, isFixMode?: boolean)
```

参数说明：

| 参数 | 说明 |
| --- | --- |
| `markdown` | 要检查的 Markdown 字符串 |
| `rules` | 规则配置，默认 `{}` |
| `isFixMode` | 是否开启自动修复，默认 `true` |

返回结果：

- `lintResult`：命中规则后的诊断结果列表（含规则名、位置信息、消息、级别）
- `diagnostics`：标准诊断格式列表（`LintDiagnostic[]`），供编辑器集成直接消费
- `fixedResult`：开启修复模式时返回修复后的文本，否则为 `null`

下面是一个最小示例，可直接作为接入起点：

```ts
import { lintMarkdown } from '@lint-md/core';

const markdown = '中文English 123';

const result = lintMarkdown(markdown, {
  'space-around-alphabet': 2,
  'space-around-number': 2,
  'no-long-code': [1, { length: 100, exclude: [] }]
}, true);

console.log(result.lintResult);
console.log(result.fixedResult);
```

```ts
// 使用标准诊断格式接入编辑器（如 Vim/Neovim ALE）
import { lintMarkdown, toALEOutput } from '@lint-md/core';

const result = lintMarkdown('中文English 123', {}, false);
console.log(toALEOutput(result.diagnostics, 'test.md'));
// test.md:1:3: E space-around-alphabet: 中英文之间需要添加空格
// test.md:1:12: W space-around-number: 中文与数字之间需要添加空格
```

`no-long-code` 的 `exclude` 用于排除指定代码语言（如 `['dot', 'mermaid']`）的长度检查。

## 📏 书写规则列表

目前内置 17 个规则，覆盖大部分的中文规则。

| 规则名 | 说明 | 可配置 | 可修复 |
| --- | --- | --- | --- |
| `space-around-alphabet` | 中文与英文之间需要空格 | 否 | 是 |
| `space-around-number` | 中文与数字之间需要空格 | 否 | 是 |
| `no-empty-code-lang` | 代码块语言不能为空 | 否 | 是 |
| `no-empty-url` | 链接/图片地址不能为空 | 否 | 是 |
| `no-empty-list` | 列表项内容不能为空 | 否 | 是 |
| `no-empty-code` | 代码块内容不能为空 | 否 | 是 |
| `no-empty-inline-code` | 行内代码内容不能为空 | 否 | 是 |
| `no-empty-blockquote` | 引用块内容不能为空 | 否 | 是 |
| `no-special-characters` | 文本中不能有特殊字符 | 否 | 是 |
| `use-standard-ellipsis` | 使用标准省略号 | 否 | 是 |
| `no-full-width-number` | 不能使用全角数字 | 否 | 是 |
| `no-space-in-link` | 链接内容前后不能有空格 | 否 | 是 |
| `no-multiple-space-blockquote` | 引用头部和内容间只能有一个空格 | 否 | 是 |
| `correct-title-trailing-punctuation` | 标题末尾标点需合法 | 否 | 是 |
| `no-space-in-inline-code` | 行内代码内容前后不能有空格 | 否 | 是 |
| `no-long-code` | 代码块行长度不能超过限制 | 是 | 否 |
| `no-half-width-punctuation` | 中文语境下应使用全角标点符号 | 否 | 是 |

欢迎大家提交需求，或者提交 PR 新增规则。

## 🔌 生态封装

lint-md 提供了多个常用场景的官方封装，可按你的工程工具链直接接入：

- [@lint-md/cli](https://github.com/lint-md/cli)：命令行批量检查与修复，适合本地和 CI。
- [@lint-md/prettier-plugin](https://github.com/lint-md/prettier-plugin)：在 Prettier 流程中统一执行中文 Markdown 规范。
- [@lint-md/eslint-plugin](https://github.com/lint-md/eslint-plugin)：将 Markdown 规则纳入 ESLint 规则体系。
- [@lint-md/vscode-plugin](https://github.com/lint-md/vscode-plugin)：在 VSCode 中实时提示并辅助修复。
- [@lint-md/ale](https://github.com/lint-md/ale)：在 Vim/Neovim 中通过 ALE 实时检查 Markdown。

也欢迎大家提交新的生态封装（Issue / PR），我们会持续收录。

### 开发新集成

按照架构原则，新集成的开发步骤（以 ALE 为例）：

1. 依赖 `@lint-md/core`
2. 调用 `lintMarkdown()` 获取 `diagnostics`
3. 使用 `toALEOutput()` 或自行转换格式
4. 处理 stdin/file 输入 → 输出 → 退出码

约 30 行代码即可完成一个新编辑器集成。

## 📄 License

[MIT](./LICENSE) © [hustcc](https://github.com/hustcc)
