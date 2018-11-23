const { Plugin } = require('ast-plugin');

const SpecialCharacters = ['\b'];

const showLength = 10;

/**
 * 无特殊字符
 * no-special-characters
 */
module.exports = class extends Plugin {

  static get type() {
    return 'no-special-characters';
  };

  pre() {}

  visitor() {
    return {
      text: ast => {
        const { value } = ast.node;

        const line = ast.node.position.start.line;
        const column = ast.node.position.start.column;

        if (value) {
          SpecialCharacters.forEach(sc => {
            const idx = value.indexOf(sc);
            if (idx !== -1) {
              const text = value.substr(Math.max(idx - Math.floor(showLength / 2), 0), showLength);

              this.cfg.throwError({
                line,
                column: column + idx + 1,
                text: `Special characters exist: '${text}'`,
              });
            }
          });
        }
      },
    }
  }

  post() {}
};
