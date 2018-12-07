const { Plugin } = require('ast-plugin');
const _ = require('lodash');
const { astChildrenPos } = require('./helper/ast');

/**
 * list 内容不能为空
 * no-empty-list
 */
module.exports = class extends Plugin {

  static get type() {
    return 'no-empty-list';
  };

  pre() {}

  visitor() {
    return {
      listItem: ast => {
        const { children } = ast.node;

        if (!children || children.length === 0) {
          const pos = astChildrenPos(ast.node);
          
          this.cfg.throwError(
            _.assign(pos, {
              text: 'List content can not be empty',
            })
          );
        }
      },
    }
  }

  post() {}
};
