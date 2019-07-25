import { Plugin } from 'ast-plugin';
import _ from 'lodash';
const { astPositionTrans } = require('../helper/ast');

/**
 * inlineCode 内容前后不能有空格
 * no-space-in-inlinecode
 */
module.exports = class extends Plugin {

  static get type() {
    return 'no-space-in-inlinecode';
  };

  pre() {}

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

  post() {}
};
