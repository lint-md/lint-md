import * as _ from 'lodash';
import * as unified from 'unified';
// @ts-ignore 无声明文件
import * as md from 'remark-parse';
import { Ast } from 'ast-plugin';
import plugins from './lint-rules';
import { LintError, LintMdRules } from './types';

/**
 * 使用 ast 和插件进行 lint
 *
 * @param markdown 字符串
 * @param rulesConfig 配置中的 rule
 * @param containAst error 结果中是否包含 ast，用于 fix
 * @returns {Promise<any>}
 */
export const lint = (markdown: string, rulesConfig?: LintMdRules, containAst?: boolean) => {
  // 所有的错误
  const errors: LintError[] = [];

  const throwFunc = (error: LintError) => {
    errors.push(error);
  };

  const ast = unified()
    .use(md)
    .parse(markdown);

  // 处理 plugin 规则
  // 通过配置的规则，来处理
  new Ast(ast, undefined, markdown).traverse(plugins(throwFunc, rulesConfig || {}));

  // 去重
  const es = _.uniqWith(errors, _.isEqual);

  // 去除 ast 键值
  return containAst ? es : es.map(error => _.omit(error, ['ast']));
};
