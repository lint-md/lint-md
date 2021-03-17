import * as _ from 'lodash';
import * as unified from 'unified';
import * as md from 'remark-parse';
import { Ast, PluginError } from 'ast-plugin';
import lintMdRulePlugins from './lint-rules';
import { LintMdRulesConfig } from './types';

/**
 * 使用 ast 和插件进行 lint
 *
 * @param markdown 字符串
 * @param rulesConfig 配置中的 rule
 * @param containAst error 结果中是否包含 ast，用于 fix，默认值 false
 * @return LintError[] lint 错误结果
 */
export const lint = (markdown: string, rulesConfig?: LintMdRulesConfig, containAst?: boolean):PluginError[] => {
  // 所有的错误
  const errors: PluginError[] = [];

  const throwFunc = (error: PluginError) => {
    errors.push(error);
  };

  const ast = unified()
    .use(md)
    .parse(markdown);

  // 拿到所有匹配的 rules
  const totalPlugins = lintMdRulePlugins(throwFunc, rulesConfig || {});

  // 处理 plugin 规则
  // 通过配置的规则，来处理
  new Ast(ast, undefined, markdown)
    .traverse(totalPlugins);

  // 去重
  const es = _.uniqWith<PluginError>(errors, _.isEqual);

  // 去除 ast 键值
  return containAst ? es : es.map(error => _.omit(error, ['ast']));
};
