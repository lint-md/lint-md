# lint-md

> 专注于中文 markdown 文件的编写格式校验。项目使用 Monorepo 的方式管理，使用 yarn 进行管理多项目。



## 模块

 - [ast-plugin](https://github.com/hustcc/lint-md/tree/master/packages/ast-plugin)：Ast 插件机制；
 - [lint-md](https://github.com/hustcc/lint-md/tree/master/packages/lint-md)：lint-md 核心 node 模块；
 - [lint-md-cli](https://github.com/hustcc/lint-md/tree/master/packages/lint-md-cli)：lint-md 的 CLI 工具，便于使用和 ci 集成；



## 开发指南


 - clone

```bash
git clone git@github.com:hustcc/lint-md.git
cd lint-md
```

 - install
 
```bash
# 务必使用 yarn，使用 yarn 进行 mono repo 的管理。
yarn install
```

 - test
 
```bash
cd ./packages/lint-md

yarn run test
```

 - build
 
```bash
yarn run build
```



## 其他

 - 项目没有 eslint 相关工具，请务必自行保证代码分支一致；
 - rule 规则的 pr，请先提 issue 讨论，防止无用劳动；
 - 请保证单测覆盖至少 99%；
