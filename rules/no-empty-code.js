const { Plugin } = require('ast-plugin');

const type = 'no-empty-code';

/**
 * code 代码块内容不能为空
 * no-empty-code
 */
module.exports = class extends Plugin {

  pre() {}

  emptyCode(ast) {
    const { value } = ast.node;

    const line = ast.node.position.start.line;
    const column = ast.node.position.start.column;

    if (!value || !value.trim()) {
      this.cfg.throwError({
        line,
        column,
        level: 'error',
        text: 'Code block can not be empty',
        type,
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
