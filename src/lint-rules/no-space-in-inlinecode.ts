import { Plugin } from '@lint-md/ast-plugin';
import * as _ from 'lodash';
import { astPositionTrans } from '../helper/ast';


/**
 * inlineCode 内容前后不能有空格
 * no-space-in-inlinecode
 */
export default class extends Plugin {

  static get type() {
    return 'no-space-in-inlinecode';
  }

  visitor() {
    return {
      inlineCode: ast => {
        const { node } = ast;
        const { position } = node;

        const spec = _.trim(ast.segment(), '`');

        if (_.head(spec) === ' ' || _.last(spec) === ' ') {
          const pos = astPositionTrans(position);

          this.cfg.throwError({
            ...pos,
            text: `'${spec}'`,
            ast,
          });
        }
      },
    }
  }

  pre() {
  }

  post() {
  }
}
