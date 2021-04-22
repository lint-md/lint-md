import { Plugin } from '@lint-md/ast-plugin';

const defaultConfig = {
  length: 100,
  exclude: []
};

/**
 * 代码长度有限制
 * no-long-code
 */
export default  class extends Plugin {
  static get type() {
    return 'no-long-code';
  }

  visitor() {
    const config = Object.assign({}, defaultConfig, this.cfg.config);
    return {
      code: (ast) => {
        const { lang, value, position } = ast.node;
        if (config.exclude.indexOf(lang) >= 0) return;
        value.split('\n').forEach((line, i) => {
          const isTooLong = line.length > config.length;
          if (isTooLong) {
            const { start } = position;
            this.cfg.throwError({
              start: {
                line: start.line + i + 1,
                column: 1
              },
              end: {
                line: start.line + i + 1,
                column: line.length + 1
              },
              text: `line with ${line.length} characters exceeds code max length ${config.length}`,
              ast
            });
          }
          return !isTooLong;
        });
      }
    };
  }

  pre() {
  }

  post() {
  }
}
