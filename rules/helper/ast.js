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

module.exports = {
  astToText,
};
