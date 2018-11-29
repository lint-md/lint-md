const { Plugin } = require('ast-plugin');
const _ = require('lodash');
const { astToText } = require('./helper/ast');

/**
 * emphasis 内容前后不能有空格
 * no-space-in-emphasis
 */
module.exports = class extends Plugin {

  static get type() {
    return 'no-space-in-emphasis';
  };

  pre() {}

  visitor() {
    return {
      strong: ast => {
        const text = astToText(ast.node);
        const line = ast.node.position.start.line;
        const column = ast.node.position.start.column;

        if (_.startsWith(text, ' ') || _.endsWith(text, ' ')) {
          this.cfg.throwError({
            line,
            column,
            text: `Emphasis content can not start / end with space: '${text}'`,
          });
        }
      },
    }
  }

  post() {}
};
