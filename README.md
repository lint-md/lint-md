# lint-md

> 用于检查中文 markdown 编写格式规范的命令行工具，基于 AST 开发，且方便集成 ci。Cli tool to lint your markdown file for Chinese.

[![Build Status](https://travis-ci.org/hustcc/lint-md.svg?branch=master)](https://travis-ci.org/hustcc/lint-md)
[![npm](https://img.shields.io/npm/v/lint-md.svg)](https://www.npmjs.com/package/lint-md)
[![npm](https://img.shields.io/npm/dm/lint-md.svg)](https://www.npmjs.com/package/lint-md)



## 安装

> **npm i -g lint-md**



## 使用

```bash
Usage: <lint-md> <files...> [options]

lint your markdown files

Options:
  -v, --version                  output the version number
  -c, --config [configure-file]  use the configure file, default .lintmdrc
  -h, --help                     output usage information
```


Example:

```bash
lint-md README.md Document.md
```



## 检查类型

> 检查规则来源于 [chinese-copywriting-guidelines](https://github.com/sparanoid/chinese-copywriting-guidelines).

| 规则 | 详细描述 | 解决办法 |
| ------ | ------ | ------ |
| space-between   | 中文与英文数字之间需要增加空格 | 响应位置增加空格 |
| no-empty-code-lang   | 代码语言不能为空 | 在代码块语法上增加语言 |
| no-empty-url   | 链接和图片地址不能为空 | 填写完整的 url，或者不使用链接和图片语法 |
| no-empty-list   | List 内容不能为空 | List 语法中，填写内容 |
| no-empty-code   | 代码块内容不能为空 | 去掉代码块，或者填充代码内容 |


> 目前仅仅检查了比较通用的类型，**欢迎 pull request**，在 `rules` 中增加自己的规则，开发约束：

 - 规则主要针对于中文 markdown 的编写规范
 - 使用类 babel plugin 的方式来进行规则检查，一个插件对应一个规则
 - 规则名称对应和插件文件名保持一致
 - 先提 issue 进行讨论
 - [AST 工具](https://astexplorer.net/)，使用其中的 markdown AST 辅助开发插件



## 配置

默认所有的规则都是 `error` 类型，但是可以通过配置来指定规则类型。示例 `.lintmdrc` ：

```json
{
  "excludeFiles": [],
  "rules": {
    "no-empty-code": 1
  }
}
```

通过 rules 来配置规则的等级。

 - **0**：ignore
 - **1**：warning
 - **2**：error

通过 excludeFiles 来忽略文件和目录，glob 语法。



## ci 集成

 -  Travis

> 在 `.travis.yml` 文件中配置以下内容。

```yml
language: node_js
node_js:
  - "10"
before_install:
  - npm i -g lint-md
script: lint-md README.md
```

 -  lint-stage

> 在 `package.json` 中增加以下配置。

```json
"lint-staged": {
  "src/**/*.{md,markdown}": [
    "lind-md"
  ]
}
```



## License

MIT@[hustcc](https://github.com/hustcc).
