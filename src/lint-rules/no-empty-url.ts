import { Plugin } from 'ast-plugin';

/**
 * link image 中地址不能为空
 * no-empty-url
 */
module.exports = class extends Plugin {

  static get type() {
    return 'no-empty-url';
  }

  emptyUrl(ast, text) {
    const { url } = ast.node;

    const { end } = ast.node.position;

    if (!url) {
      this.cfg.throwError({
        start: {
          line: end.line,
          column: end.column - 1
        },
        end: {
          line: end.line,
          column: end.column
        },
        text,
        ast
      });
    }
  }

  visitor() {
    return {
      link: ast => this.emptyUrl(ast, ''),
      image: ast => this.emptyUrl(ast, '')
    };
  }
};
