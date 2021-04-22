import { Plugin } from '@lint-md/ast-plugin';
import { getChildrenPosition } from '../helper/ast';


/**
 * delete 代码块内容不能为空
 * no-empty-delete
 */
export default class extends Plugin {

  static get type() {
    return 'no-empty-delete';
  }

  visitor() {
    return {
      delete: ast => {
        if (ast.node.children.length === 0) {
          const pos = getChildrenPosition(ast.node);

          this.cfg.throwError({
            ...pos,
            text: '',
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
