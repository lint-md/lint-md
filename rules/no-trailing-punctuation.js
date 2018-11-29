const { Plugin } = require('ast-plugin');
const _ = require('lodash');
const { astToText } = require('./helper/ast');

const Symbols = '.,;:!?。，；：！？…';

/**
 * Header 内容不能以标点符号结尾
 * no-trailing-punctuation
 */
module.exports = class extends Plugin {

  static get type() {
    return 'no-trailing-punctuation';
  };

  pre() {}

  visitor() {
    return {
      heading: ast => {
        const text = astToText(ast.node);
        const line = ast.node.position.start.line;
        const column = ast.node.position.start.column;

        if (_.includes(Symbols, _.last(_.trimEnd(text)))) {
          this.cfg.throwError({
            line,
            column,
            text: `Header content can not end with symbol: '${text}'`,
          });
        }
      },
    }
  }

  post() {}
};
