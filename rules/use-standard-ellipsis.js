const { Plugin } = require('ast-plugin');

const NonstandardEllipsis = ['...', '......'];

const showLength = 12;

/**
 * 使用标准规范的省略号
 * use-standard-ellipsis
 */
module.exports = class extends Plugin {

  static get type() {
    return 'use-standard-ellipsis';
  };

  pre() {}

  visitor() {
    return {
      text: ast => {
        const { value } = ast.node;

        const line = ast.node.position.start.line;
        const column = ast.node.position.start.column;

        if (value) {
          NonstandardEllipsis.forEach(sc => {
            const idx = value.indexOf(sc);
            if (idx !== -1) {
              const text = value.substr(Math.max(idx - Math.floor(showLength / 2), 0), showLength);

              this.cfg.throwError({
                line,
                column: column + idx + 1,
                text: `Non-standard ellipsis exists: '${text}'`,
              });
            }
          });
        }
      },
    }
  }

  post() {}
};
