const { Plugin } = require('ast-plugin');
const { stringType } = require('./helper/string');

const type = 'space-between';
// 匹配 [ZA, AZ, ZN, NZ]
const matches = ['ZA', 'AZ', 'ZN', 'NZ'];

/**
 * 中文和英文、数字之间需要有空格
 * space-between
 */
module.exports = class extends Plugin {

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
          if (matches.indexOf(s) !== -1) {
            // 存在则抛出去
            this.cfg.throwError({
              line,
              column: column + i,
              level: 'error',
              text: text,
              type,
            });
          }
        }
      },
    }
  }

  post() {}
};
