/*
 * File: constants.ts
 * Description: 保存常量
 * Created: 2021-3-8 21:28:22
 * Author: yuzhanglong
 * Email: yuzl1123@163.com
 */


// 不可以 fix 的 rule
const NOT_SUPPORTED_FIX = ['no-long-code']

// 带参 rules，此类 rules 单独处理，不通过模板写入
const ARGS_RULES = ['no-long-code']


module.exports = {
  NOT_SUPPORTED_FIX,
  ARGS_RULES
}