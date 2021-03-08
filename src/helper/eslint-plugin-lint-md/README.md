# eslint-plugin-lint-md

依靠各个 IDE 对 eslint 不错的支持，让 lint-md 玩家也能得到愉悦的文档编写体验。

![](https://user-images.githubusercontent.com/56540811/110348136-48bb7480-806c-11eb-89ec-ad9ee2ab42f1.png)

## 安装

> **npm i eslint eslint-plugin-lint-md**


## 使用

为你的 `.eslintrc.js` 追加以下配置，其中 `rules` 请参考 [lint-md](https://github.com/lint-md/lint-md#%E6%A3%80%E6%9F%A5%E7%B1%BB%E5%9E%8B)

```javascript
module.exports = {
  plugins: [
    'lint-md'
  ],
  overrides: [
    {
      files: ['*.md'],
      parser: 'eslint-plugin-lint-md/src/parser',
      rules: {
        // rules 在这里自定义
        'lint-md/space-round-alphabet': ["warn"],
        'lint-md/no-empty-list': ["warn"],
        'lint-md/no-long-code': [2, {
          "length": 10,
          "exclude": []
        }]
      }
    },
  ]
}
```

如果你喜欢 `vscode`，那么请安装 `eslint` 插件，然后为 `settings.json` 添加以下配置：

```json
{
    "eslint.validate": ["markdown"]
}
```


如果你喜欢 `webstorm`，请按下图配置以支持 `.md` 后缀文件：

![](http://cdn.yuzzl.top/blog/20210309004301.png)

> TIP：webstorm 2021.1 版本开始支持非 js 的扩展名文件（用户可自行配置），现在这个版本处于测试阶段，应该离 release 不远了。


**hope you enjoy it！**
