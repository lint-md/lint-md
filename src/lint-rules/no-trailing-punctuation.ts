import { Plugin } from 'ast-plugin';

const _ = require('lodash');
const { getLastChildLeaf } = require('../helper/ast');

const Symbols = '.,;:!?。，；：！？…~*`';

/**
 * Header 内容不能以标点符号结尾
 * no-trailing-punctuation
 */
module.exports = class extends Plugin {

  static get type() {
    return 'no-trailing-punctuation';
  }

  visitor() {
    return {
      heading: ast => {
        const last = getLastChildLeaf(ast.node);
        const text = last.value;

        if (_.includes(Symbols, _.last(_.trimEnd(text)))) {
          const { start, end } = last.position;

          this.cfg.throwError({
            start: {
              line: start.line,
              column: start.column
            },
            end: {
              line: end.line,
              column: end.column
            },
            text: `'${text}'`,
            ast
          });
        }
      }
    };
  }
};
