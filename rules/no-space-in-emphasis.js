const { Plugin } = require('ast-plugin');
const _ = require('lodash');
const { astToText, astChildrenPos } = require('./helper/ast');

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

        if (_.startsWith(text, ' ') || _.endsWith(text, ' ')) {
          const pos = astChildrenPos(ast.node);
          
          this.cfg.throwError(
            _.assign(pos, {
              text: `Emphasis content can not start / end with space: '${text}'`,
            })
          );
        }
      },
    }
  }

  post() {}
};
