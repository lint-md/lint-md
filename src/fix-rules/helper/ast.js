import _ from 'lodash';

export const getChildrenPosition = ast => {
  const children = _.get(ast.node, 'children', []);

  const start = _.get(_.head(children), 'position.start', {});
  const end = _.get(_.last(children), 'position.end', {});

  return {
    start,
    end,
  };
};

export const getLastChildLeaf = node => {
  const leaf =_.last(_.get(node, 'children', []));

  // 如果存在，则递归，否则返回自己
  if (leaf !== undefined) return getLastChildLeaf(leaf);
  return node;
};
