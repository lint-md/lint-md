import { Plugin } from 'ast-plugin';
const { astChildrenPos } = require('./helper/ast');

/**
 * code 代码块内容不能为空
 * no-empty-inlinecode
 */
module.exports = class extends Plugin {

  static get type() {
    return 'no-empty-inlinecode';
  };

  pre() {}

  emptyCode(ast) {
    const { value } = ast.node;

    if (!value || !value.trim()) {
      const pos = astChildrenPos(ast.node);

      this.cfg.throwError({
        ...pos,
        text: '',
        ast,
      });
    }
  }

  visitor() {
    return {
      inlineCode: ast => {
        this.emptyCode(ast);
      }
    }
  }

  post() {}
};
