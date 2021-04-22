import { Plugin } from '@lint-md/ast-plugin';

/**
 * 中文和英文、数字之间需要有空格
 * no-empty-code-lang
 */
export default class extends Plugin {

  static get type() {
    return 'no-empty-code-lang';
  }

  visitor() {
    return {
      code: ast => {
        const { lang } = ast.node;

        const line = ast.node.position.start.line;
        const column = ast.node.position.start.column;

        if (!lang) {
          this.cfg.throwError({
            start: {
              line,
              column
            },
            end: {
              line,
              column: column + 3
            },
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
