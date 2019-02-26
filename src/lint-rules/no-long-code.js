import { Plugin } from 'ast-plugin';

const defaultConfig = {
  length: 100,
  excludes: [],
};

/**
 * 代码长度有限制
 * no-long-code
 */
module.exports = class extends Plugin {
  static get type() {
    return 'no-long-code';
  }

  pre() { }

  visitor() {
    const config = Object.assign({}, defaultConfig, this.cfg.config);
    return {
      code: (ast) => {
        const { lang, value, position } = ast.node;
        if (config.excludes.indexOf(lang) >= 0) return;
        value.split('\n').every((line, i) => {
          const isTooLong = line.length > config.length;
          if (isTooLong) {
            const { start } = position;
            this.cfg.throwError({
              start: {
                line: start.line + i + 1,
                column: 1,
              },
              end: {
                line: start.line + i + 1,
                column: line.length + 1,
              },
              text: `line with ${line.length} characters exceeds code max length ${config.length}`,
              ast,
            });
          }
          return !isTooLong;
        });
      },
    };
  }

  post() { }
}
