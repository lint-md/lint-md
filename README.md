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
[![build](https://github.com/lint-md/lint-md/actions/workflows/build.yml/badge.svg)](https://github.com/lint-md/lint-md/actions/workflows/build.yml)

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

### SourceCode 范围

每次 lint 执行创建一个 `SourceCode` 实例。
规则通过 `context.sourceCode` 读取原文和 AST。
规则也通过该实例转换文本范围。

```ts
const range = context.sourceCode.getTextRange(node, start, end);

context.report({
  range,
  message: '发现不规范文本'
});
```

所有范围使用 JavaScript UTF-16 索引。
范围采用 `[start, end)` 语义。
`TextRange` 是只读的二元组。

无效范围会抛出 `InvalidRuleRangeError`。
映射缺失会抛出 `SourceMapUnavailableError`。
节点被修改后，映射会抛出 `SourceMapConsistencyError`。
映射错误不会进入 `executionErrors`。

## 🚀 快速使用

从 API 到结果处理，核心只需要一个方法即可完成 lint/fix。当前对外仅提供 **1 个核心 API**：`lintMarkdown`。

```ts
lintMarkdown(
  markdown: string,
  rules?: LintMdRulesConfig,
  isFixMode?: boolean,
  options?: LintExecutionOptions
)
```

参数说明：

| 参数 | 说明 |
| --- | --- |
| `markdown` | 要检查的 Markdown 字符串 |
| `rules` | 规则配置，默认 `{}` |
| `isFixMode` | 是否开启自动修复，默认 `true` |
| `options.ruleErrorPolicy` | 规则执行失败策略：默认 `'collect'` 返回部分结果及错误；`'strict'` 首次失败即抛出 `RuleExecutionFailure` |

返回结果：

- `lintResult`：命中规则后的诊断结果列表（含规则名、位置信息、消息、级别）
- `diagnostics`：标准诊断格式列表（`LintDiagnostic[]`），供编辑器集成直接消费
- `fixedResult`：开启修复模式时返回 `{ result, notAppliedFixes }`（`result` 为修复后的文本，`notAppliedFixes` 为因冲突等原因未能应用的修复项），否则为 `null`
- `executionErrors`：规则执行失败的结构化列表。非空时，`diagnostics` 与 `lintResult` 可能只是部分结果；CLI 和编辑器 Adapter 应据此标记本次检查不完整。

### Unapplied fix contract

Each `notAppliedFixes` item contains these fields:

- `range`: The range is relative to the input of the final fix round.
- `text`: The replacement text.
- `targetRule`: The source `rule.meta.name`.
- `reason`: A stable conflict code.

The range is not necessarily relative to the returned `result`.
The `reason` value is `overlap` or `same-offset`.
`overlap` means that the fix starts inside an applied range.
`same-offset` means that an earlier insertion owns the same offset.
The result contains only conflicts from the final fix round.
The new `targetRule` and `reason` fields use JSON-compatible strings.
The optional `data` field remains rule-defined.
The API does not guarantee that `data` supports JSON serialization.

下面是一个最小示例，可直接作为接入起点：

```ts
import { lintMarkdown } from '@lint-md/core';

const markdown = '中文English 123';

const result = lintMarkdown(markdown, {
  'space-around-alphabet': 2,
  'space-around-number': 2,
  'no-long-code': [1, { length: 100, exclude: [] }],
  'require-trailing-spaces': 2,
  'space-around-link': 2,
  'no-multiple-blank-lines': 2
}, true);

console.log(result.lintResult);
console.log(result.fixedResult.result);
```

```ts
// 使用标准诊断格式接入编辑器（如 Vim/Neovim ALE）
import { lintMarkdown, toALEOutput } from '@lint-md/core';

const result = lintMarkdown('中文English 123', {}, false);
console.log(toALEOutput(result.diagnostics, 'test.md'));
// test.md:1:3: E space-around-alphabet: 中英文之间需要添加空格
// test.md:1:12: W space-around-number: 中文与数字之间需要添加空格
```

集成层应在消费 diagnostics 前检查执行错误；默认 `'collect'` 保留可用的部分结果，适合
交互式编辑器。需要快速失败的 CI 可显式启用 strict 模式：

```ts
const result = lintMarkdown(markdown, rules, false);

if (result.executionErrors.length > 0) {
  // 标记本次 lint 结果不完整，并按 Adapter 的策略记录或设置退出码。
}

lintMarkdown(markdown, rules, false, {
  ruleErrorPolicy: 'strict'
}); // 首次规则执行失败即抛出 RuleExecutionFailure
```

`no-long-code` 的 `exclude` 用于排除指定代码语言（如 `['dot', 'mermaid']`）的长度检查。

## 📏 书写规则列表

目前内置 20 个规则，覆盖大部分的中文规则。

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
| `require-trailing-spaces` | 软换行前需要两个空格 | 否 | 是 |
| `space-around-link` | 链接与正文之间需要空格 | 否 | 是 |
| `no-multiple-blank-lines` | 连续空白行最多保留一行 | 否 | 是 |

`require-trailing-spaces`、`space-around-link` 和 `no-multiple-blank-lines` 默认关闭。
CLI 用户可以在项目根目录的 `.lintmdrc` 中启用这些规则：

| 规则级别 | 含义 |
| --- | --- |
| `0` | 关闭规则 |
| `1` | 生成警告 |
| `2` | 生成错误 |

下面的示例将三条规则设置为错误级别：

```json
{
  "rules": {
    "require-trailing-spaces": 2,
    "space-around-link": 2,
    "no-multiple-blank-lines": 2
  }
}
```

CLI 默认读取 `./.lintmdrc`。也可以使用 `lint-md --config <文件路径>` 指定配置文件。

直接使用 Core API 时，在 `lintMarkdown()` 的第二个参数中配置该规则：

```ts
import { lintMarkdown, RULE_SEVERITY } from '@lint-md/core';

const markdown = '第一行\n第二行';
const result = lintMarkdown(
  markdown,
  {
    'require-trailing-spaces': RULE_SEVERITY.ERROR,
    'space-around-link': RULE_SEVERITY.ERROR,
    'no-multiple-blank-lines': RULE_SEVERITY.ERROR
  },
  true
);

console.log(result.fixedResult.result);
```

`RULE_SEVERITY.ERROR` 等同于规则级别 `2`。
第三个参数为 `true` 时，Core 自动修复文本。设置为 `false` 时，Core 只返回检查结果。

`space-around-link` 处理普通链接、自动链接和引用链接。它不处理独立图片。
全角标点、其他 Unicode 标点、已有空白和块边界不需要空格。连续链接之间只添加一个空格。

`no-multiple-blank-lines` 将连续空白行修复为一个空白行。
它删除文档开头的空白行。它保留文档末尾的一个换行。
空格和 Tab 组成的行也算空白行。代码块内部内容不受影响。

欢迎大家提交需求，或者提交 PR 新增规则。

## 🔌 生态封装

lint-md 提供了多个常用场景的官方封装，可按你的工程工具链直接接入：

- [@lint-md/cli](https://github.com/lint-md/cli)：命令行批量检查与修复，适合本地和 CI。
- [@lint-md/prettier-plugin](https://github.com/lint-md/prettier-plugin)：在 Prettier 流程中统一执行中文 Markdown 规范。
- [@lint-md/eslint-plugin](https://github.com/lint-md/eslint-plugin)：将 Markdown 规则纳入 ESLint 规则体系。
- [@lint-md/vscode-plugin](https://github.com/lint-md/vscode-plugin)：在 VSCode 中实时提示并辅助修复。

也欢迎大家提交新的生态封装（Issue / PR），我们会持续收录。

### 开发新集成

按照架构原则，新集成的开发步骤（以 ALE 为例）：

1. 依赖 `@lint-md/core`
2. 调用 `lintMarkdown()` 获取 `diagnostics`，并检查 `executionErrors` 是否为空
3. 使用 `toALEOutput()` 或自行转换格式
4. 处理 stdin/file 输入 → 输出 → 退出码；CI 需要快速失败时启用 strict 模式

约 30 行代码即可完成一个新编辑器集成。

## 🛠️ 开发

```bash
# 安装依赖
npm install

# 运行测试
npm test

# 代码检查
npm run lint

# 类型检查
npm run typecheck

# 构建
npm run build
```

`npm run lint` checks TypeScript and MJS files in `src/`, `__tests__/`, and `scripts/`.

### 维护公共 API

项目使用 [API Extractor](https://api-extractor.com/) 跟踪 `@lint-md/core` 的公开类型接口。API 基线保存在 `etc/core.api.md`，该文件由工具生成，请勿手动编辑。

修改导出函数、类型、枚举或规则对象后，运行：

```bash
npm run api:report
```

该命令会重新构建项目，并根据当前声明文件更新 API report。提交代码前请检查 `etc/core.api.md` 的 diff，确认其中只包含预期的 API 变化，并将更新后的 report 与源码一起提交。

CI 会在构建后运行：

```bash
npm run api:check
```

如果源码生成的公共 API 与已提交的 report 不一致，检查将失败。

发布前会自动执行完整校验（lint → typecheck → build → test）。

## 📄 License

[MIT](./LICENSE) © [hustcc](https://github.com/hustcc)
