import { lint } from '../src';

/**
 * lint 一个 markdown 文件！
 * 用于测试规则的工具方法！
 * @param md
 * @param rules
 * @returns {*}
 */
export default (md, rules) => {
  return lint(md, rules);
};

