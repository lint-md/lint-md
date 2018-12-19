import { Plugin } from 'ast-plugin';
const { astChildrenPos } = require('./helper/ast');

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

    if (!value || !value.trim()) {
      const pos = astChildrenPos(ast.node);

      this.cfg.throwError({
        ...pos,
        text: 'Code block can not be empty',
        ast,
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
