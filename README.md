# lint-md 2.0 Beta

> ⚠️提示：你现在看到的是 2.0 的 Beta
> 版本，预计十一月发布正式版，如果要查看稳定版本请切换到 **[stable](https://github.com/lint-md/lint-md/tree/stable)** 分支。

lint-md 是检查中文 Markdown 编写格式的工具，让你的文档更加优雅规范。

[![Build Status](https://travis-ci.org/hustcc/lint-md.svg?branch=master)](https://travis-ci.org/hustcc/lint-md)
[![npm](https://img.shields.io/npm/v/@lint-md/core.svg)](https://www.npmjs.com/package/lint-md)
[![npm](https://img.shields.io/npm/dm/@lint-md/core.svg)](https://www.npmjs.com/package/@lint-md/core)

## 快速开始

我们提供了两种使用的方式，命令行和 Node.js API，前者适合单独使用（推荐），后者适合更加定制化的 Lint 需求。

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

## 规则一览

> 检查规则来源于 [chinese-document-style-guide](https://github.com/ruanyf/document-style-guide).

### space-around-alphabet

中文与英文之间需要增加空格

**正确**

对应提示的位置增加空格

### 配置选项

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
