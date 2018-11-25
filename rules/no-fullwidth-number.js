const { Plugin } = require('ast-plugin');
const { isFullwidthNumber, stringAround } = require('./helper/string');

const showLength = 10;

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
              column: idx, 
              text: stringAround(text, idx - column, showLength)
            });
            // 每行只检测第一个错误
            break;
          }
        }
      },
    }
  }

  post() {}
};
