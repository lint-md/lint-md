# lint-md


> 用于检查中文 markdown 编写格式规范的核心模块，基于 AST 开发。Library used to lint your markdown file for Chinese.

[![Build Status](https://travis-ci.org/hustcc/lint-md.svg?branch=master)](https://travis-ci.org/hustcc/lint-md)
[![Coverage Status](https://coveralls.io/repos/github/hustcc/lint-md/badge.svg?branch=master)](https://coveralls.io/github/hustcc/lint-md)
[![npm](https://img.shields.io/npm/v/lint-md.svg)](https://www.npmjs.com/package/lint-md)
[![npm](https://img.shields.io/npm/dm/lint-md.svg)](https://www.npmjs.com/package/lint-md)



## 安装

> **npm i --save lint-md**



## API 调用

```js
import { lint, fix, getDescription } from 'lint-md';

// get the markdown 's style errors
const errors = lint(markdown, rules);

// get the error type description
const describe = getDescription(type[, lang = 'en_US']);

// fix the markdown
const fixed = fix(markdown);
```

 - **lint**：通过 API 方式来校验 markdown 文本；
 - **fix**：通过 API 方式来修复文本；
 - **getDescription**：获取错误类型的文本描述，包含多语言；
 - **version**：获得模块的版本号；



## 检查类型

> 检查规则来源于 [chinese-document-style-guide](https://github.com/ruanyf/document-style-guide).

| 规则 | 详细描述 | 解决办法 | 配置选项 | 自动修复 |
| ------ | ------ | ------ | ----- | ----- |
| space-round-alphabet | 中文与英文之间需要增加空格 | 对应提示的位置增加空格 | | √ |
| space-round-number | 中文与数字之间需要增加空格 | 对应提示的位置增加空格 | | √ |
| no-empty-code-lang | 代码语言不能为空 | 在代码块语法上增加语言 | | √ |
| no-empty-delete | delete 块内容不能为空 | 删除空的 delete 文本块 | | √ |
| no-empty-url | 链接和图片地址不能为空 | 填写完整的 url，或者不使用链接和图片语法 | | √ |
| no-empty-list | List 内容不能为空 | List 语法中，填写内容 | | √ |
| no-empty-code | 代码块内容不能为空 | 删除空的代码块，或者填充代码内容 | | √ |
| no-empty-inlinecode | 行内代码块内容不能为空 | 删除空的代码块，或者填充代码内容 | | √ |
| no-empty-blockquote | blockquote 内容不能为空 | 删除空的 blockquote，或者填充内容 | | √ |
| no-special-characters | 文本中不能有特殊字符 | 可能是复制出来的特殊字符，删除特殊字符即可 | | √ |
| use-standard-ellipsis | 使用标准规范的省略号 | 使用标准规范的省略号‘……’ / ‘...’ | | √ |
| no-fullwidth-number | 不能用全角数字 | 注意输入法切换为半角输入 | | √ |
| no-space-in-emphasis | emphasis 内容前后不能有空格 | 删除 emphasis 内容中的前后空格即可 | | √ |
| no-space-in-link | link 内容前后不能有空格 | 删除 link 内容中的前后空格即可 | | √ |
| no-multiple-space-blockquote | blockquote 语法不能包含有多个空格 | 删除 blockquote 内容中多余的空格 | | √ |
| no-trailing-punctuation | 标题不能以标点符号结尾 | 删除标题最后的标点符号 | | √ |
| no-space-in-inlinecode | 行内代码内容，前后不能有空格 | 删除行内代码中的前后空格 | | √ |
| no-long-code | 代码块不能有过长的代码 | 对展示代码做格式上的修改 | `length`, `exclude` （见下文说明） | x |


### 配置选项

`no-long-code` 接受两个可配置参数：

+ `length`: 每行代码接受的最大长度，数字，默认值为 `100`
+ `exclude`: 可以配置部分代码类型不做长度检查，字符串数组，默认值为 `[]`


### Pull Request

> 目前仅仅检查了比较通用的类型，**欢迎 pull request**，在 `rules` 中增加自己的规则，开发约束：

 - 规则主要针对于中文 markdown 的编写规范
 - 使用类 babel plugin 的方式来进行规则检查，一个插件对应一个规则
 - 规则名称对应和插件文件名保持一致
 - 先提 issue 进行讨论
 - [AST 工具](https://astexplorer.net/)，使用其中的 markdown AST 辅助开发插件



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

 - **0**：ignore 忽略不检查该规则
 - **1**：warning 警告，但不阻断 ci
 - **2**：error 错误，且阻断 ci

如果 `value` 是一个数组，那么第一个是数字，表示该规则的等级；第二个为规则可接受的配置信息。




## 其他相关

 - [lint-md-cli](https://github.com/hustcc/lint-md/packages/lint-md-cli)：lint-md 模块的 CLI 工具，方便用于 ci 集成。
 - [vscode 插件](https://marketplace.visualstudio.com/items?itemName=ZhixiangZhang.mdlint#review-details)：在 vscode 中使用 lint-md 工具。
 - [语雀 lint 服务](https://github.com/hustcc/yuque-lint)：利用语雀的 webhook 自动校验提交的文档格式并做提醒。



## License

MIT@[hustcc](https://github.com/hustcc).
