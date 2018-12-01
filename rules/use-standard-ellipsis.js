const { Plugin } = require('ast-plugin');
const { subErrorStr } = require('./helper/string');

const showLength = 14;

// 找到所有的 …
const findAllSingleEllipsis = s => {
  const r = [];
  const re = /…{1,}/g; // 使用正则匹配

  while (true) {
    const matched = re.exec(s);

    // 只要不是两个，都是不规范的
    if (matched && matched[0].length !== 2) {
      r.push(matched.index);
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
      r.push(matched.index);
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
module.exports = class extends Plugin {

  static get type() {
    return 'use-standard-ellipsis';
  };

  pre() {}

  visitor() {
    return {
      text: ast => {
        const text = ast.node.value;

        const line = ast.node.position.start.line;
        const column = ast.node.position.start.column;

        findAllDotEllipsis(text).concat(findAllSingleEllipsis(text)).forEach(idx => {
          this.cfg.throwError({
            line,
            column: column + idx + 1,
            text: `Non-standard ellipsis exists: '${subErrorStr(text, idx, showLength)}'`,
          });
        });
      },
    }
  }

  post() {}
};
