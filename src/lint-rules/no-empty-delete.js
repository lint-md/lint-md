import { Plugin } from 'ast-plugin';
const { astChildrenPos } = require('./helper/ast');

/**
 * delete 代码块内容不能为空
 * no-empty-delete
 */
module.exports = class extends Plugin {

  static get type() {
    return 'no-empty-delete';
  };

  pre() {}

  visitor() {
    return {
      delete: ast => {
        if (ast.node.children.length === 0) {
          const pos = astChildrenPos(ast.node);

          this.cfg.throwError({
            ...pos,
            text: '',
            ast,
          });
        }
      },
    }
  }

  post() {}
};
