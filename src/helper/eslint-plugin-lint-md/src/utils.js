/*
 * File: utils.ts
 * Description: 工具函数模块
 * Created: 2021-3-8 21:29:46
 * Author: yuzhanglong
 * Email: yuzl1123@163.com
 */
const fs = require('fs')
const path = require("path");
const {ARGS_RULES} = require("./constants");

// 模板导出文件头部注释信息输出
const getTemplateHeaderComment = (rule, time, command = "npm run sync-rules") => {
  return `/*
 * IMPORTANT!
 * This file has been automatically generated,
 * in order to update it's content execute "${command}"
 *
 * @created: ${time || new Date().toDateString()} ${!rule ? '' : `\n * @rule: ${rule || 'undefined'}`}
 */\n\n`
}

// 获取 lint-md 下的所有 rules
const getTotalRuleNames = () => {
  const ruleDir = path.resolve(__dirname, '../../../lint-rules')
  const ruleFiles = fs.readdirSync(ruleDir)
  return ruleFiles
    .filter(res => (res !== 'index.js' && res.endsWith('.js')))
    .map(data => data.slice(0, -3))
    .filter(data => ARGS_RULES.indexOf(data) < 0)
}

module.exports = {
  getTemplateHeaderComment,
  getTotalRuleNames
}