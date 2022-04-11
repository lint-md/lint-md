import * as _ from 'lodash';
import * as unified from 'unified';
import * as markdownParser from 'remark-parse';
import { Ast } from '@lint-md/ast-plugin';
import * as frontmatter from 'remark-frontmatter';
import lintMdRulePlugins from './lint-rules';
import { LintMdRulesConfig, LintMdError } from './type';

/**
 * 使用 ast 和插件进行 lint
 *
 * @param markdown 字符串
 * @param rulesConfig 配置中的 rule
 * @param containAst error 结果中是否包含 ast，用于 fix，默认值 false
 * @return LintError[] lint 错误结果
 */
export const lint = (markdown: string, rulesConfig?: LintMdRulesConfig, containAst?: boolean):LintMdError[] => {
  // 所有的错误
  const errors: LintMdError[] = [];

  const throwFunc = (error: LintMdError) => {
    errors.push(error);
  };

  const ast = unified()
    .use(markdownParser)
    .use(frontmatter, ['yaml', 'toml'])
    .parse(markdown);

  // 拿到所有匹配的 rules
  const totalPlugins = lintMdRulePlugins(throwFunc, rulesConfig || {});

  // 处理 plugin 规则
  // 通过配置的规则，来处理
  new Ast(ast, undefined, markdown)
    .traverse(totalPlugins);

  // 去重
  const es = _.uniqWith<LintMdError>(errors, _.isEqual);

  // 去除 ast 键值
  return containAst ? es : es.map(error => _.omit(error, ['ast']));
};
