const { Plugin } = require('ast-plugin');

const { isFullwidthNumber } = require('./helper/string');

/**
 * 无全角数字
 * no-fullwidth-number
 */
module.exports = class extends Plugin {

  static get type() {
    return 'no-fullwidth-number';
  };

  pre() {}

  visitor() {
    return {
      text: ast => {
        const text = ast.node.value;
       
        const line = ast.node.position.start.line;
        const column = ast.node.position.start.column;

        for (let i = 0; i < text.length; i ++) {
          if(isFullwidthNumber(text[i])) {
            const idx = column + i;
            
            this.cfg.throwError({
              line,
              column: idx, // column 从 1 开始
              text: 'Number can not be fullwidth',
            });
          }
        }
      },
    }
  }

  post() {}
};
