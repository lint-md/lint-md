import { Plugin } from '@lint-md/ast-plugin';
import { getChildrenPosition } from '../helper/ast';


/**
 * code 代码块内容不能为空
 * no-empty-code
 */
export default class extends Plugin {

  static get type() {
    return 'no-empty-code';
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
      code: ast => {
        this.emptyCode(ast);
      }
    };
  }

  pre() {
  }

  post() {
  }
}
