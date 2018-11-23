const { Plugin } = require('ast-plugin');

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

        const line = ast.node.position.start.line;
        const column = ast.node.position.start.column;

        if (!children || children.length === 0) {
          this.cfg.throwError({
            line,
            column,
            text: 'Blockquote content can not be empty',
          });
        }
      },
    }
  }

  post() {}
};
