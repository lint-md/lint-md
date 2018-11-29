const { Plugin } = require('ast-plugin');
const _ = require('lodash');
const { astToText } = require('./helper/ast');

/**
 * Link 内容前后不能有空格
 * no-space-in-link
 */
module.exports = class extends Plugin {

  static get type() {
    return 'no-space-in-link';
  };

  pre() {}

  visitor() {
    return {
      link: ast => {
        const text = astToText(ast.node);
        const line = ast.node.position.start.line;
        const column = ast.node.position.start.column;

        if (_.startsWith(text, ' ') || _.endsWith(text, ' ')) {
          this.cfg.throwError({
            line,
            column,
            text: `Link content can not start / end with space: '${text}'`,
          });
        }
      },
    }
  }

  post() {}
};
