const { Plugin } = require('ast-plugin');
const { subErrorStr } = require('./helper/string');

const SpecialCharacters = ['\b'];
const showLength = 12;

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
              const text = subErrorStr(value, idx, showLength);

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
