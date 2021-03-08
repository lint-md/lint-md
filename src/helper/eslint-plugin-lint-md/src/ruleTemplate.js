const {lint, getDescription} = require('lint-md')
const baseFixer = require('lint-md/lib/fix').fix

// 该 rule 是否可以 fix
const FIXABLE = $FIXABLE$

module.exports = {
  meta: {
    type: 'suggestion',
    fixable: FIXABLE
  },
  create(context) {
    // 获取 fixer
    const getFixer = (node) => {
      return FIXABLE ? {
        fix: (fixer) => {
          const newMarkdown = baseFixer(node.value)
          return fixer.replaceTextRange(
            [0, node.value.length - 1],
            newMarkdown
          );
        }
      } : {}
    }

    return {
      Literal(node) {
        if (node.value) {
          // 调用 lint 函数
          const errors = lint(node.value);
          const resultErr = errors.filter(e => e.type === '$MD_LINT_RULE_NAME$')
          for (let err of resultErr) {
            const describe = getDescription(err.type)
            context.report({
              message: describe.message,
              loc: {
                start: err.start,
                end: err.end
              },
              ...getFixer(node)
            })
          }
        }
      }
    }
  }
}
