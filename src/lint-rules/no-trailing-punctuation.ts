import { Plugin } from '@lint-md/ast-plugin';
import * as _ from 'lodash';
import { getLastChildLeaf } from '../helper/ast';


const Symbols = '.,;:!?。，；：！？…~*`';

/**
 * Header 内容不能以标点符号结尾
 * no-trailing-punctuation
 */
export default class extends Plugin {

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

  pre() {
  }

  post() {
  }
}
