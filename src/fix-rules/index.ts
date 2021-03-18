import * as _ from 'lodash';
import { LintMdRules, PluginError } from '../type';


// 引入所有的规则
const Rules: LintMdRules = {
  'no-empty-blockquote': require('./no-empty-blockquote').default,
  'no-empty-code': require('./no-empty-code').default,
  'no-empty-code-lang': require('./no-empty-code-lang').default,
  'no-empty-delete': require('./no-empty-delete').default,
  'no-empty-inlinecode': require('./no-empty-inlinecode').default,
  'no-empty-list': require('./no-empty-list').default,
  'no-empty-url': require('./no-empty-url').default,
  'no-fullwidth-number': require('./no-fullwidth-number').default,
  'no-multiple-space-blockquote': require('./no-multiple-space-blockquote').default,
  'no-space-in-emphasis': require('./no-space-in-emphasis').default,
  'no-space-in-inlinecode': require('./no-space-in-inlinecode').default,
  'no-space-in-link': require('./no-space-in-link').default,
  'no-special-characters': require('./no-special-characters').default,
  'no-trailing-punctuation': require('./no-trailing-punctuation').default,
  'space-round-alphabet': require('./space-round-alphabet').default,
  'space-round-number': require('./space-round-number').default,
  'use-standard-ellipsis': require('./use-standard-ellipsis').default
};

/**
 * 处理 markdown 错误的拦截器机制
 *
 * @param markdown
 * @param error
 * @returns {*}
 */
export default (markdown: string, error: PluginError) => {
  const { type } = error;
  // 使用对应的规则去处理
  const func = _.get(Rules, [type]);

  if (func) {
    return func(markdown, error);
  }

  // 找不到，直接返回原始
  return markdown;
}
