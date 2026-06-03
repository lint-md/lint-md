# 🧹 lint-md/core

> 让中文 Markdown 写作更规范、更一致。

[![npm version](https://img.shields.io/npm/v/@lint-md/core.svg)](https://www.npmjs.com/package/@lint-md/core)
[![npm downloads](https://img.shields.io/npm/dm/@lint-md/core.svg)](https://www.npmjs.com/package/@lint-md/core)
[![license](https://img.shields.io/github/license/lint-md/lint-md)](https://github.com/lint-md/lint-md/blob/main/LICENSE)
[![stars](https://img.shields.io/github/stars/lint-md/lint-md?style=social)](https://github.com/lint-md/lint-md)

## ✨ 特性

- **专注中文 Markdown 规范**：围绕中文写作场景设计规则与自动修复能力。
- **规则可配置、可扩展**：支持按规则粒度配置等级与参数，也支持扩展规则。
- **生态封装完善**：可接入 CLI、Prettier、ESLint、VSCode，也欢迎按业务场景继续封装。

## 🚀 快速使用

### API 文档

- 核心入口：[`src/core/lint-markdown.ts`](./src/core/lint-markdown.ts)
- 类型定义：[`src/types.ts`](./src/types.ts)
- 内置规则导出：[`src/rules/index.ts`](./src/rules/index.ts)

### 最小示例

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

## 📏 书写规则列表

| 规则名 | 说明 | 可配置 | 可自动修复 |
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
| `no-long-code` | 代码块行长度不能超过限制 | 是（`length`、`exclude`） | 否 |

## 🔌 生态封装

lint-md 已提供以下生态封装：

- [@lint-md/cli](https://github.com/lint-md/cli)
- [@lint-md/prettier-plugin](https://github.com/lint-md/prettier-plugin)
- [@lint-md/eslint-plugin](https://github.com/lint-md/eslint-plugin)
- [@lint-md/vscode-plugin](https://github.com/lint-md/vscode-plugin)

欢迎提交新的生态封装（Issue / PR），我们会持续收录。

## 📄 License

[MIT](./LICENSE) © [hustcc](https://github.com/hustcc)
