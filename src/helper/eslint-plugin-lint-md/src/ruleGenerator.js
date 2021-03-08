/*
 * File: constants.ts
 * Description: rules 生成器
 *
 * 对于一些无参 rules(几乎所有)
 * 我们直接基于 lint-md 生成相应的模板，
 * 这样无需再去花费大量时间单独写 rules
 *
 * Created: 2021-3-8 23:38:56
 * Author: yuzhanglong
 * Email: yuzl1123@163.com
 */

const path = require('path')
const fs = require("fs");
const {getTotalRuleNames} = require("./utils");
const {getTemplateHeaderComment} = require("./utils");
const {NOT_SUPPORTED_FIX} = require("./constants");

// paths
const templatePath = path.resolve(__dirname, './ruleTemplate.js')
const eslintRuleDir = path.resolve(__dirname, './rules/noArgsRules')

// 生成 eslint rules 文件
const generateRuleCode = () => {
  const template = fs.readFileSync(templatePath)
  const rules = getTotalRuleNames()
  let data = `module.exports = {\n  'no-long-code': require('./no-long-code'),\n`

  // 生成 rules && index.js
  rules.forEach(name => {
    const comment = getTemplateHeaderComment(name)

    const result = template.toString()
      .replace(/\$MD_LINT_RULE_NAME\$/g, name)
      .replace(/\$FIXABLE\$/g, NOT_SUPPORTED_FIX.indexOf(name) >= 0 ? false : '"code"')

    fs.writeFileSync(path.resolve(eslintRuleDir, `${name}.js`), `${comment}${result}`)
    data += `  '${name}': require('./noArgsRules/${name}'),\n`
  })
  data += '}'

  fs.writeFileSync(path.resolve(path.resolve(eslintRuleDir, '../'), 'index.js'), `${getTemplateHeaderComment()}${data}`)
}

generateRuleCode()

