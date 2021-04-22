import { Plugin } from '@lint-md/ast-plugin';
import { subErrorStr } from './helper/string';


const showLength = 14;

// 找到所有的 …
const findAllSingleEllipsis = s => {
  const r = [];
  const re = /…{1,}/g; // 使用正则匹配

  while (true) {
    const matched = re.exec(s);

    // 只要不是两个，都是不规范的
    if (matched && matched[0].length !== 2) {
      r.push({
        index: matched.index,
        length: matched[0].length
      });
    } else {
      break;
    }
  }
  return r;
};

// 找到所有的 . 组成的省略号
const findAllDotEllipsis = s => {
  const r = [];
  const re = /\.{4,}/g; // 使用正则匹配

  while (true) {
    const matched = re.exec(s);

    if (matched) {
      r.push({
        index: matched.index,
        length: matched[0].length
      });
    } else {
      break;
    }
  }
  return r;
};


/**
 * 使用标准规范的省略号
 * 要判断准确，还是必须一个一个处理
 * use-standard-ellipsis
 */
export default class extends Plugin {

  static get type() {
    return 'use-standard-ellipsis';
  }

  visitor() {
    return {
      text: ast => {
        const text = ast.node.value;

        const line = ast.node.position.start.line;
        const column = ast.node.position.start.column;

        findAllDotEllipsis(text).concat(findAllSingleEllipsis(text)).forEach(item => {
          this.cfg.throwError({
            start: {
              line,
              column: column + item.index
            },
            end: {
              line,
              column: column + item.index + item.length
            },
            text: `'${subErrorStr(text, item.index, showLength)}'`,
            ast
          });
        });
      }
    };
  }

  pre() {
  }

  post() {
  }
}
