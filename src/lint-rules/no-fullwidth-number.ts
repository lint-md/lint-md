import { Plugin } from '@lint-md/ast-plugin';

/**
 * 从字符串中找出所有的数字字符串和索引
 * @param s
 * @returns {Array}
 */
const findAllNumbers = s => {
  const re = new RegExp('[0-9０-９]{1,}', 'g');
  const r = [];

  // 循环找出所有的数字
  while (true) {
    const matched = re.exec(s);

    if (matched) {
      r.push({
        number: matched[0],
        index: matched.index
      });
    } else {
      break;
    }
  }
  return r;
};

/**
 * 判断一个数字字符串是否存在全角数字
 * @param s
 * @returns {boolean}
 */
const isFullWidthNumber = s => {
  return /[０-９]/.test(s);
};

/**
 * 无全角数字
 * no-fullwidth-number
 */
export default class extends Plugin {

  static get type() {
    return 'no-fullwidth-number';
  }

  visitor() {
    return {
      text: ast => {
        const text = ast.node.value;

        const line = ast.node.position.start.line;
        const column = ast.node.position.start.column;
        findAllNumbers(text).forEach(num => {
          const { number, index } = num;

          if (isFullWidthNumber(number)) {
            this.cfg.throwError({
              start: {
                line,
                column: column + index + 1
              },
              end: {
                line,
                column: column + index + 1 + number.length
              },
              text: `'${number}'`,
              ast
            });
          }
        });
      }
    };
  }

  pre() {
  }

  post() {
  }
}
