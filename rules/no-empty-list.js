const { Plugin } = require('ast-plugin');

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

        const line = ast.node.position.start.line;
        const column = ast.node.position.start.column;

        if (!children || children.length === 0) {
          this.cfg.throwError({
            line,
            column,
            text: 'List content can not be empty',
          });
        }
      },
    }
  }

  post() {}
};
