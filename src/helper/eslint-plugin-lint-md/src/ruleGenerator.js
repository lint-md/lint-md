const fs = require('fs')
const path = require('path')

const ruleDir = path.resolve(__dirname, '../../../lint-rules')
const templatePath = path.resolve(__dirname, './ruleTemplate.js')
const eslintRuleDir = path.resolve(__dirname, './rules')

const HEADERS = `/*
 * IMPORTANT!
 * This file has been automatically generated,
 * in order to update it's content execute "npm run sync-rules"
 */\n\n`


const getTotalRuleNames = () => {
  const ruleFiles = fs.readdirSync(ruleDir)
  return ruleFiles
    .filter(res => (res !== 'index.js' && res.endsWith('.js')))
    .map(data => data.slice(0, -3))
}


const generateRuleCode = () => {
  const template = fs.readFileSync(templatePath)
  const rules = getTotalRuleNames()
  let data = 'module.exports = {\n'

  // 生成 rules && index.js
  rules.forEach(name => {
    const result = template.toString().replace('$MD_LINT_RULE_NAME$', name)
    fs.writeFileSync(path.resolve(eslintRuleDir, `${name}.js`), `${HEADERS}${result}`)
    data += `  '${name}': require('./${name}'),\n`
  })
  data += '}'
  fs.writeFileSync(path.resolve(eslintRuleDir, 'index.js'), `${HEADERS}${data}`)
}

generateRuleCode()

