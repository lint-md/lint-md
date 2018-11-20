const { Plugin } = require('ast-plugin');

const type = 'no-empty-list';

/**
 * list 内容不能为空
 * no-empty-list
 */
module.exports = class extends Plugin {

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
            level: 'error',
            text: 'list content can not be empty',
            type,
          });
        }
      },
      image: ast => {
        const { url, value } = ast.node;

        const line = ast.node.position.start.line;
        const column = ast.node.position.start.column;

        if (!url) {
          this.cfg.throwError({
            line,
            column,
            level: 'error',
            text: 'image url can not be empty',
            type,
          });
        }
      },
    }
  }

  post() {}
};
