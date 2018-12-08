const { Plugin } = require('ast-plugin');
const _ = require('lodash');
const { astChildrenPos } = require('./helper/ast');

/**
 * blockquote 块内容不能为空
 * no-empty-blockquote
 */
module.exports = class extends Plugin {

  static get type() {
    return 'no-empty-blockquote';
  };

  pre() {}

  visitor() {
    return {
      blockquote: ast => {
        const { children } = ast.node;

        if (!children || children.length === 0) {
          const pos = astChildrenPos(ast.node);

          this.cfg.throwError(
            _.assign(pos, {
              text: 'Blockquote content can not be empty',
            })
          );
        }
      },
    }
  }

  post() {}
};
