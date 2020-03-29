import _ from 'lodash';

const astPointTrans = point => {
  return {
    line: _.get(point, 'line', 0),
    column: _.get(point, 'column', 0),
  }
};

/**
 * ast 的 position 转输出的 position
 * @param pos
 * @return {{start: {line, column}, end: {line, column}}}
 */
export const astPositionTrans = pos => {
  return {
    start: astPointTrans(pos.start),
    end: astPointTrans(pos.end),
  };
};


/**
 * 获得子节点的 position
 * @param node
 * @return {{start: *, end: *}}
 */
export const getChildrenPosition = node => {
  const children = _.get(node, 'children', []);

  if (children.length === 0) {
    return astPositionTrans(node.position)
  }

  const start = astPointTrans(_.get(_.head(children), 'position.start', {}));
  const end = astPointTrans(_.get(_.last(children), 'position.end', {}));

  return {
    start,
    end,
  };
};

/**
 * 递归获得最后的一个文本节点
 * @param node
 * @return {*}
 */
export const getLastChildLeaf = node => {
  const leaf =_.last(_.get(node, 'children', []));

  // 如果存在，则递归，否则返回自己
  if (leaf !== undefined) return getLastChildLeaf(leaf);
  return node;
};


/**
 * 将 ast 中的 text 内容合并起来，作为文本字符串！
 * @param node
 */
export const astToText = node => {
  const type = _.get(node, 'type');
  if (['text', 'inlineCode', 'html'].indexOf(type) !== -1) return node.value;

  const childrenText = _.get(node, 'children', []).map(astToText);
  return childrenText.join('');
};
