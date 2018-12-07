const _ = require('lodash');

/**
 * 将 ast 中的 text 内容合并起来，作为文本字符串！
 * @param ast
 */
const astToText = ast => {
  if (_.get(ast, 'type') === 'text') return ast.value;

  const childrenText = _.get(ast, 'children', []).map(astToText);
  return childrenText.join('');
};

/**
 * 获取 ast 中的子元素占据的位置
 * @param {*} ast 
 */
const astChildrenPos = ast => {
  const children = ast.children;
  if (!children || children.length === 0) {
    const line = ast.position.start.line;
    const column = ast.position.start.column;
    return {
      start: {
        line,
        column
      },
      end: {
        line,
        column
      }
    }
  }

  const first = children[0];
  const last = children[children.length - 1];
  return {
    start: {
      line: first.position.start.line,
      column: first.position.start.column,
    },
    end: {
      line: last.position.end.line,
      column: last.position.end.column,
    }
  }
}

module.exports = {
  astToText,
  astChildrenPos
};
