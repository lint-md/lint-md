const { Plugin } = require('ast-plugin');
const _ = require('lodash');
const { astToText, astLastText } = require('./helper/ast');
const { endSpaceLen } = require('./helper/string');

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

        if (_.includes(Symbols, _.last(_.trimEnd(text)))) {
          const last = astLastText(ast.node);
          const end = last.position.end;
          const endSpace = endSpaceLen(last.value);
          
          this.cfg.throwError({
            start: {
              line: end.line,
              column: end.column - 1 - endSpace
            },
            end: {
              line: end.line,
              column: end.column - endSpace
            },
            text: `Header content can not end with symbol: '${text}'`,
          });
        }
      },
    }
  }

  post() {}
};
