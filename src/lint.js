import _ from 'lodash';
import unified from 'unified';
import md from 'remark-parse';
import { Ast } from 'ast-plugin';
import plugins from './lint-rules';

/**
 * 使用 ast 和插件进行 lint
 * @param markdown 字符串
 * @param rulesConfig 配置中的 rule
 * @param containAst error 结果中是否包含 ast，用于 fix
 * @returns {Promise<any>}
 */
export const lint = (markdown, rulesConfig = {}, containAst = false) => {
  // 所有的错误
  const errors = [];

  const throwFunc = error => {
    errors.push(error);
  };

  const ast = unified()
    .use(md)
    .parse(markdown);

  // 处理 plugin 规则
  // 通过配置的规则，来处理
  new Ast(ast, undefined, markdown).traverse(plugins(throwFunc, rulesConfig));

  const es = _.uniqWith(errors, _.isEqual); // 去重

  return containAst ? es : es.map(error => _.omit(error, ['ast'])); // 去除 ast 键值
};
