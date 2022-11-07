# Lint Markdown 2.0 Beta

> ⚠️ 提示：你现在看到的是 2.0 的 Beta 版本，预计十一月发布正式版，如果要查看稳定版本请切换到 **[stable](https://github.com/lint-md/lint-md/tree/stable)** 分支。

Lint Markdown 是检查中文 Markdown 编写格式的工具，让你的文档更加优雅规范。

[![build](https://github.com/lint-md/lint-md/actions/workflows/build.yml/badge.svg)](https://github.com/lint-md/lint-md/actions/workflows/build.yml)
[![npm](https://img.shields.io/npm/v/@lint-md/core.svg)](https://www.npmjs.com/package/lint-md)
[![npm](https://img.shields.io/npm/dm/@lint-md/core.svg)](https://www.npmjs.com/package/@lint-md/core)

## 快速开始

我们提供了两种使用的方式，命令行和 Node.js API，前者适合大部分用户使用（推荐），后者适合更加定制化的 Lint 需求。

### 使用命令行（CLI）

安装依赖

```shell
npm install -g @lint-md/cli@beta
```

命令示例

```shell
# 校验当前目录下的 test.md 文件
lint-md test.md

# 校验当前目录下的 test.md 文件，并修复之
lint-md test.md --fix

# 校验 examples 目录下所有的 Markdown 文件，并修复之
lint-md examples/**/* --fix

# 校验 examples 目录下所有的 Markdown 文件，指定 config.json 为配置文件
lint-md examples/**/* --config=config.json

# 校验 examples 目录下所有的 Markdown 文件，仅存在 warning 时程序正常退出（warning 不会阻断 CI）
lint-md examples/**/* --suppress-warnings

# 校验 examples 目录下所有的 Markdown 文件，并开启多线程模式（8 个线程）
lint-md examples/**/* --threads=8
```

API 如下所示：

```shell
Options:
  -v, --version                  output the version number（查看当前版本）
  -c, --config [configure-file]  use the configure file, default .lintmdrc（使用配置文件，默认为 .lintmdrc）
  -f, --fix                      fix the errors automatically（开启修复模式）
  -d, --dev                      open dev mode（开启开发者模式）
  -t, --threads [thread-count]   The number of threads. The default is based on the number of available CPUs.（执行 Lint / Fix 的线程数，默认为 1）
  -s, --suppress-warnings        suppress all warnings, that means warnings will not block CI（抑制所有警告，这意味着警告不会阻止 CI）
  -h, --help                     display help for command（查看帮助）
```

### 使用 Node.js API

TODO

## 规则概述

> 检查规则来源于 [chinese-document-style-guide](https://github.com/ruanyf/document-style-guide).


| 规则                                | 详细描述                      | 解决办法                | 可自动修复     |
|------------------------------------|------------------------------|------------------------|------------|
| space-around-alphabet              | 中文与英文之间需要增加空格        | 对应提示的位置增加空格   | ✅    |
| space-around-number                | 中文与数字之间需要增加空格        | 对应提示的位置增加空格   | ✅    | 
| no-empty-code-lang                 | 代码语言不能为空                | 在代码块语法上增加语言     | ✅    |
| no-empty-url                       | 链接和图片地址不能为空            | 填写完整的 url，或者不使用链接和图片语法 | ✅    | 
| no-empty-list                      | list 内容不能为空               | 删除空的 list 或者补充内容   | ✅    | 
| no-empty-code                      | 代码块内容不能为空               | 删除空的代码块，或者填充代码内容   | ✅    | 
| no-empty-inline-code                | 行内代码块内容不能为空            | 删除空的行内代码块，或者填充代码内容     | ✅    | 
| no-empty-blockquote                | 引用块内容不能为空               | 删除空的引用块，或者填充内容 | ✅    |
| no-special-characters              | 文本中不能有特殊字符             | 可能是复制出来的特殊字符，删除特殊字符即可  | ✅    |
| use-standard-ellipsis              | 使用标准规范的省略号             | 使用标准规范的省略号‘……’ / ‘...’ | ✅    | 
| no-fullwidth-number                | 不能用全角数字                  | 注意输入法切换为半角输入           | ✅    |
| no-space-in-link                   | 链接前后不能有空格            | 删除链接内容的前后空格     | ✅    |
| no-multiple-space-blockquote       | 引用块头部和内容间只能有一个空格    | 删除多余的空格 | ✅    |
| correct-title-trailing-punctuation | 标题末尾只能使用合适的标点符号（允许问号、叹号、省略号） | 删除标题最后不合法的标点符号   | ✅    |
| no-space-in-inline-code            | 行内代码内容前后不能有空格        | 删除行内代码中的前后空格          | ✅    |
| no-long-code                       | 代码块不能有过长的代码（代码长度可配置，见下文）  | 对展示代码做格式上的修改        | x    |

**规则配置**

`no-long-code` 接受两个可配置参数：

+ `length`: 每行代码接受的最大长度，数字，默认值为 `100`
+ `exclude`: 可以配置部分代码类型不做长度检查，字符串数组，默认值为 `[]`

### Pull Request

> 目前仅仅检查了比较通用的类型，**欢迎 Pull Request**，在 `rules` 中增加自己的规则，开发约束：

- 规则主要针对于中文 Markdown 的编写规范
- 规则名称对应和插件文件名保持一致
- 先提 issue 进行讨论
- [AST 工具](https://astexplorer.net/)，使用其中的 Markdown AST 辅助开发插件

## Rules 配置

默认所有的规则都是 `error` 类型，看一个 rules 规则配置的示例：

```js
const rules = {
  "no-empty-code": 1,
  "no-long-code": [2, {
    "length": 100,
    "exclude": ["dot"]
  }]
};

const errors = lint(markdown, rules);
```

通过 rules 来配置规则。`key` 对应规则的名称。如果 `value` 是一个数字，那么表示规则的等级：

- **0**：off 忽略，不检查该规则
- **1**：warning 警告，但不阻断 CI（ExitCode = 0）
- **2**：error 错误，且阻断 CI（ExitCode = 1）

如果 `value` 是一个数组，那么第一个是数字，表示该规则的等级；第二个为规则可接受的配置信息。

## License

MIT@[hustcc](https://github.com/hustcc).
