const { Plugin } = require('ast-plugin');

/**
 * code 代码块内容不能为空
 * no-empty-code
 */
module.exports = class extends Plugin {

  static get type() {
    return 'no-empty-code';
  };

  pre() {}

  emptyCode(ast) {
    const { value } = ast.node;

    const line = ast.node.position.start.line;
    const column = ast.node.position.start.column;

    if (!value || !value.trim()) {
      this.cfg.throwError({
        line,
        column,
        text: 'Code block can not be empty',
      });
    }
  }

  visitor() {
    return {
      code: ast => {
        this.emptyCode(ast);
      },
      inlineCode: ast => {
        this.emptyCode(ast);
      }
    }
  }

  post() {}
};
