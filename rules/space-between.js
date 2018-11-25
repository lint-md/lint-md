const { Plugin } = require('ast-plugin');
const { stringType, subErrorStr } = require('./helper/string');

// 匹配 [ZA, AZ, ZN, NZ]
const matches = ['ZA', 'AZ', 'ZN', 'NZ'];
const showLength = 12;

/**
 * 中文和英文、数字之间需要有空格
 * space-between
 */
module.exports = class extends Plugin {

  static get type() {
    return 'space-between';
  };

  pre() {}

  visitor() {
    return {
      text: ast => {
        const text = ast.node.value;

        const line = ast.node.position.start.line;
        const column = ast.node.position.start.column;

        const typeText = text.split('').map(s => stringType(s)).join('');

        for (let i = 0; i < typeText.length; i ++) {
          const s = typeText.substr(i, 2);
          const idx = column + i;

          if (matches.indexOf(s) !== -1) {
            // 存在则抛出去
            this.cfg.throwError({
              line,
              column: idx + 1, // column 从 1 开始
              text: subErrorStr(text, idx, showLength),
            });
          }
        }
      },
    }
  }

  post() {}
};
