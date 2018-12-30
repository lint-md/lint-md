import _ from 'lodash';

// 引入所有的规则
const Rules = {
  'no-empty-blockquote': require('./no-empty-blockquote').default,
  'no-empty-code': require('./no-empty-code').default,
  'no-empty-code-lang': require('./no-empty-code-lang').default,
  'no-empty-inlinecode': require('./no-empty-inlinecode').default,
  'no-empty-list': require('./no-empty-list').default,
  'no-empty-url': require('./no-empty-url').default,
};

/**
 * 处理 markdown 错误的拦截器机制
 * @param markdown
 * @param error
 * @returns {*}
 */
export default (markdown, error) => {
  const { type } = error;
  // 使用对应的规则去处理
  const func = _.get(Rules, [type]);

  if (func) {
    return func(markdown, error);
  }

  // 找不到，直接返回原始
  return markdown;
}
