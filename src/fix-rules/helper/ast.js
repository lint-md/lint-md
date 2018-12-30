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
