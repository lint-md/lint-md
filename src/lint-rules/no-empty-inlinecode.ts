import { Plugin } from '@lint-md/ast-plugin';
import { getChildrenPosition } from '../helper/ast';


/**
 * code 代码块内容不能为空
 * no-empty-inlinecode
 */
export default class extends Plugin {

  static get type() {
    return 'no-empty-inlinecode';
  }

  emptyCode(ast) {
    const { value } = ast.node;

    if (!value || !value.trim()) {
      const pos = getChildrenPosition(ast.node);

      this.cfg.throwError({
        ...pos,
        text: '',
        ast
      });
    }
  }

  visitor() {
    return {
      inlineCode: ast => {
        this.emptyCode(ast);
      }
    };
  }

  pre() {
  }

  post() {
  }
}
