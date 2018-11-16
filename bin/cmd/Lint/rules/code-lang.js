const { Plugin } = require('ast-plugin');
const _ = require('lodash');
const { stringType } = require('../../../helper/string');

const type = 'code-lang';
// 匹配 [ZA, AZ, ZN, NZ]
const matches = ['ZA', 'AZ', 'ZN', 'NZ'];

/**
 * 中文和英文、数字之间需要有空格
 * code-lang
 */
module.exports = class extends Plugin {

  pre() {}

  visitor() {
    return {
      code: ast => {
        const { lang, value } = ast.node;

        const line = ast.node.position.start.line;
        const column = ast.node.position.start.column;

        if (!lang) {
          this.cfg.throwError({
            line,
            column,
            level: 'error',
            text: 'lang can not be empty',
            type,
          });
        }
      },
    }
  }

  post() {}
};
