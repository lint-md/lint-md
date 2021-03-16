import { Plugin } from 'ast-plugin';
const { getChildrenPosition } = require('../helper/ast');

/**
 * delete 代码块内容不能为空
 * no-empty-delete
 */
module.exports = class extends Plugin {

  static get type() {
    return 'no-empty-delete';
  }

  pre() {}

  visitor() {
    return {
      delete: ast => {
        if (ast.node.children.length === 0) {
          const pos = getChildrenPosition(ast.node);
          // @ts-ignore
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
