const { Plugin } = require('ast-plugin');

/**
 * @param ast 传入的 ast
 * @param text 抛错信息
 */
const visitorHelper = (ast, text) => {
  const { url, value } = ast.node;

  const line = ast.node.position.start.line;
  const column = ast.node.position.start.column;

  if (!url) {
    this.cfg.throwError({
      line,
      column,
      text
    });
  }
};

/**
 * link image 中地址不能为空
 * no-empty-url
 */
module.exports = class extends Plugin {

  static get type() {
    return 'no-empty-url';
  };

  pre() {}

  visitor() {
    return {
      link: ast => {
        visitorHelper(ast, 'Link url can not be empty');
      },
      image: ast => {
        visitorHelper(ast, 'Image url can not be empty');
      },
    }
  }

  post() {}
};
