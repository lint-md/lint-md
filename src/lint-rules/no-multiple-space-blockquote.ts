import { Plugin } from 'ast-plugin';

const _ = require('lodash');
const { astToText } = require('../helper/ast');
const { substr, startSpaceLen } = require('./helper/string');

/**
 * blockquote 后面不能有多个空格
 * no-multiple-space-blockquote
 */
module.exports = class extends Plugin {

  static get type() {
    return 'no-multiple-space-blockquote';
  }

  visitor() {
    return {
      blockquote: ast => {
        const text = astToText(ast.node);
        const line = ast.node.position.start.line;
        const column = ast.node.position.start.column;

        if (_.startsWith(text, ' ')) {
          this.cfg.throwError({
            start: {
              line,
              column
            },
            end: {
              line,
              column: column + 1 + startSpaceLen(text)
            },
            text: `'${substr(text)}'`,
            ast
          });
        }
      }
    };
  }
};
