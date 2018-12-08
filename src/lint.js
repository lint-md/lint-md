import _ from 'lodash';
import unified from 'unified';
import md from 'remark-parse';
import { Ast } from 'ast-plugin';

const plugins = require('./rules');

/**
 * 使用 ast 和插件进行 lint
 * @param markdown 字符串
 * @param rules 配置中的 rule
 * @returns {Promise<any>}
 */
export const lint = (markdown, rules = {}) => {

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
  new Ast(ast).traverse(plugins(throwFunc, rules));

  return _.uniqWith(errors, _.isEqual); // 去重
};
