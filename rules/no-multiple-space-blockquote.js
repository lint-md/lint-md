const { Plugin } = require('ast-plugin');
const _ = require('lodash');
const { astToText } = require('./helper/ast');
const { substr } = require('./helper/string');

/**
 * blockquote 后面不能有多个空格
 * no-multiple-space-blockquote
 */
module.exports = class extends Plugin {

  static get type() {
    return 'no-multiple-space-blockquote';
  };

  pre() {}

  visitor() {
    return {
      blockquote: ast => {
        const text = astToText(ast.node);
        const line = ast.node.position.start.line;
        const column = ast.node.position.start.column;

        if (_.startsWith(text, ' ')) {
          this.cfg.throwError({
            line,
            column,
            text: `Blockquote content can not start with space: '${substr(text)}'`,
          });
        }
      },
    }
  }

  post() {}
};
