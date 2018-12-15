const { Plugin } = require('ast-plugin');
const { astPositionTrans } = require('./helper/ast');

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

        let spec = ast.getSpec().split('').filter(s => s !== '`').join('');

        if (spec.startsWith(' ') || spec.endsWith(' ')) {
          const pos = astPositionTrans(position);

          this.cfg.throwError({
            ...pos,
            text: `Inline code content can not start / end with space: '${spec}'`,
          });
        }
      },
    }
  }

  post() {}
};
