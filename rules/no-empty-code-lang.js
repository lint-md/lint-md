const { Plugin } = require('ast-plugin');

/**
 * 中文和英文、数字之间需要有空格
 * no-empty-code-lang
 */
module.exports = class extends Plugin {

  static get type() {
    return 'no-empty-code-lang';
  };

  pre() {}

  visitor() {
    return {
      code: ast => {
        const { lang, value } = ast.node;

        const line = ast.node.position.start.line;
        const column = ast.node.position.start.column;

        if (!lang) {
          this.cfg.throwError({
            line,
            column,
            text: 'Language of code can not be empty',
          });
        }
      },
    }
  }

  post() {}
};
