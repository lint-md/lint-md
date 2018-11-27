const _ = require('lodash');
const unified = require('unified');
const markdown = require('remark-parse');
const { Ast } = require('ast-plugin');

const plugins = require('../rules');

/**
 * lint 一个 markdown 文件！
 * 用于测试规则的工具方法！
 * @param md
 * @param rules
 * @returns {*}
 */
module.exports = (md, rules = {}) => {
  const errors = [];

  const throwFunc = error => {
    errors.push(error);
  };

  const ast = unified()
    .use(markdown)
    .parse(md);

  // 处理 plugin 规则
  // 通过配置的规则，来处理
  new Ast(ast).traverse(plugins(throwFunc, rules));

  return _.uniqWith(errors, _.isEqual); // 去重
};

