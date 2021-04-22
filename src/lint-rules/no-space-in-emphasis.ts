import { Plugin } from '@lint-md/ast-plugin';
import * as _ from 'lodash';
import { astToText, getChildrenPosition } from '../helper/ast';


/**
 * emphasis 内容前后不能有空格
 * no-space-in-emphasis
 */
export default class extends Plugin {

  static get type() {
    return 'no-space-in-emphasis';
  }

  visitor() {
    return {
      strong: ast => {
        const text = astToText(ast.node);

        if (_.startsWith(text, ' ') || _.endsWith(text, ' ')) {
          const pos = getChildrenPosition(ast.node);

          this.cfg.throwError({
            ...pos,
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
