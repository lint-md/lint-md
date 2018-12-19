const _ = require('lodash');

/**
 * 将 ast 中的 text 内容合并起来，作为文本字符串！
 * @param ast
 */
export const astToText = ast => {
  if (_.get(ast, 'type') === 'text') return ast.value;

  const childrenText = _.get(ast, 'children', []).map(astToText);
  return childrenText.join('');
};

/**
 * 获得最后一个text类型节点
 * @param {*} ast
 */
export const astLastText = ast => {
  const children = _.get(ast, 'children', []);
  if (children.length === 0 && _.get(ast, 'type') === 'text') return ast;

  return astLastText(_.last(children));
};

/**
 * 获取 ast 中的子元素占据的位置，如果不存在子元素，则返回当前节点的开始和结束位置
 * @param {*} ast
 */
export const astChildrenPos = ast => {
  const children = ast.children;
  if (!children || children.length === 0) {
    const pos = ast.position;
    return {
      start: {
        line: pos.start.line,
        column: pos.start.column,
      },
      end: {
        line: pos.end.line,
        column: pos.end.column,
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
};

export const astPositionTrans = pos => {
  return {
    start: {
      line: _.get(pos, 'start.line', 0),
      column: _.get(pos, 'start.column', 0),
    },
    end: {
      line: _.get(pos, 'end.line', 0),
      column: _.get(pos, 'end.column', 0),
    }
  };
};
