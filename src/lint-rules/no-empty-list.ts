import { Plugin } from '@lint-md/ast-plugin';
import { getChildrenPosition } from '../helper/ast';


/**
 * list 内容不能为空
 * no-empty-list
 */
export default class extends Plugin {

  static get type() {
    return 'no-empty-list';
  }

  visitor() {
    return {
      listItem: ast => {
        const { children } = ast.node;

        if (!children || children.length === 0) {
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
