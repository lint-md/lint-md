import { Plugin } from 'ast-plugin';
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
        const value = ast.node.value;

        const line = ast.node.position.start.line;
        const column = ast.node.position.start.column;

        SpecialCharacters.forEach(sc => {
          const idx = value.indexOf(sc);

          if (idx !== -1) {
            const text = subErrorStr(value, idx, showLength);

            this.cfg.throwError({
              start: {
                line,
                column: column + idx,
              },
              end: {
                line,
                column: column + idx + 1,
              },
              text: `'${text}'`,
              ast,
            });
          }
        });
      },
    }
  }

  post() {}
};
