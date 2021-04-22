import { Plugin } from '@lint-md/ast-plugin';
import * as _ from 'lodash';
import { astToText } from '../helper/ast';
import { startSpaceLen, substr } from './helper/string';


/**
 * blockquote 后面不能有多个空格
 * no-multiple-space-blockquote
 */
export default class extends Plugin {

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

  pre() {
  }

  post() {
  }
}
