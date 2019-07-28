# lint-md-cli


> 用于检查中文 markdown 编写格式规范的命令行工具，基于 AST 开发，且方便集成 ci；同时提供 API 方法调用。Cli tool to lint your markdown file for Chinese.

[![Build Status](https://travis-ci.org/hustcc/lint-md-cli.svg?branch=master)](https://travis-ci.org/hustcc/lint-md-cli)
[![Coverage Status](https://coveralls.io/repos/github/hustcc/lint-md-cli/badge.svg?branch=master)](https://coveralls.io/github/hustcc/lint-md-cli)
[![npm](https://img.shields.io/npm/v/lint-md-cli.svg)](https://www.npmjs.com/package/lint-md-cli)
[![npm](https://img.shields.io/npm/dm/lint-md-cli.svg)](https://www.npmjs.com/package/lint-md-cli)



## 安装

> **npm i -g lint-md-cli**



## 使用

```bash
Usage: <lint-md> <files...> [options]

lint your markdown files

Options:
  -v, --version                  output the version number
  -c, --config [configure-file]  use the configure file, default .lintmdrc
  -f, --fix                      fix the errors automatically
  -h, --help                     output usage information
```


 - 校验 lint

```bash
lint-md README.md Document.md
```


 - 修复 fix

```bash
lint-md README.md Document.md --fix
```



## 检查类型

基于 [lint-md](https://github.com/hustcc/lint-md/packages/lint-md)，具体支持的检查类型，请到该项目查看。



## 配置

默认所有的规则都是 `error` 类型，但是可以通过配置来指定规则类型。示例 `.lintmdrc` ：

```json
{
  "excludeFiles": [],
  "rules": {
    "no-empty-code": 1,
    "no-long-code": [2, {
      "length": 100,
      "exclude": ["dot"]
    }]
  }
}
```

 - 通过 rules 来配置规则。参考 [lint-md](https://github.com/hustcc/lint-md/packages/lint-md) 文档说明。
 - 通过 excludeFiles 来忽略文件和目录，glob 语法。



## ci 集成

 -  Travis

> 在 `.travis.yml` 文件中配置以下内容。

```yml
language: node_js
node_js:
  - "10"
before_install:
  - npm i -g lint-md-cli
script: lint-md README.md
```

 -  lint-stage

> 在 `package.json` 中增加以下配置。

```json
"lint-staged": {
  "src/**/*.{md,markdown}": [
    "lint-md"
  ]
}
```



## 基于 Docker

假设当前目录有一文件名为 `README.md`，可在本地使用以下命令：

```bash
docker run --rm -it -v$(pwd)/docs yuque/lint-md:cli /docs/README.md # 也可直接带其它参数
```

其中：

- `--rm` 表示在运行完毕后直接销毁容器。
- `-it` 表示交互式 TTY，你可以理解为进入容器终端。
- `-v$(pwd)/docs` 表示将当前目录「挂载」至容器内部的 `/docs` 目录。

另外，在基于 Docker 的 CI/CD 平台上，也可使用 `yuque/lint-md` 镜像。例如 GitLab CI/CD：

```yml
lint:
  image: yuque/lint-md:cli
  script:
    - lint-md README.md # 或其它文件
```

Circle CI：

```yml
version: 2
jobs:
  lint:
    docker:
      - image: yuque/lint-md:cli
    steps:
      - checkout
      - run: lint-md README.md # 或其它文件
```

利用 Docker 作为 CI 的基础环境通常更有优势，不必每次构建都执行 `yarn install`；资源节省，速度也会更快些。




## License

MIT@[hustcc](https://github.com/hustcc).
