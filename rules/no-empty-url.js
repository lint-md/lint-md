const { Plugin } = require('ast-plugin');

/**
 * link image 中地址不能为空
 * no-empty-url
 */
module.exports = class extends Plugin {

  static get type() {
    return 'no-empty-url';
  };

  pre() {}

  emptyUrl(ast, text) {
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
  }

  visitor() {
    return {
      link: ast => this.emptyUrl(ast, 'Link url can not be empty'),
      image: ast => this.emptyUrl(ast, 'Image url can not be empty')
    }
  }

  post() {}
};
