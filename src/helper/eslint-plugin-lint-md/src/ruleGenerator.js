const fs = require('fs')
const path = require('path')
const {getTemplateHeaderComment} = require("./utils");
const {NOT_SUPPORTED_FIX} = require("./constants");

// paths
const ruleDir = path.resolve(__dirname, '../../../lint-rules')
const templatePath = path.resolve(__dirname, './ruleTemplate.js')
const eslintRuleDir = path.resolve(__dirname, './rules')

// 获取 lint-md 下的所有 rules
const getTotalRuleNames = () => {
  const ruleFiles = fs.readdirSync(ruleDir)
  return ruleFiles
    .filter(res => (res !== 'index.js' && res.endsWith('.js')))
    .map(data => data.slice(0, -3))
}

// 生成 eslint rules 文件
const generateRuleCode = () => {
  const template = fs.readFileSync(templatePath)
  const rules = getTotalRuleNames()
  let data = 'module.exports = {\n'

  // 生成 rules && index.js
  rules.forEach(name => {
    const comment = getTemplateHeaderComment(name)

    const result = template.toString()
      .replace(/\$MD_LINT_RULE_NAME\$/g, name)
      .replace(/\$FIXABLE\$/g, NOT_SUPPORTED_FIX.indexOf(name) >= 0 ? false : '"code"')

    fs.writeFileSync(path.resolve(eslintRuleDir, `${name}.js`), `${comment}${result}`)
    data += `  '${name}': require('./${name}'),\n`
  })
  data += '}'

  fs.writeFileSync(path.resolve(eslintRuleDir, 'index.js'), `${getTemplateHeaderComment()}${data}`)
}

generateRuleCode()

