const {lint, getDescription} = require('lint-md')
const baseFixer = require('lint-md/lib/fix').fix

module.exports = {
  meta: {
    type: 'suggestion',
    fixable: $FIXABLE$
  },
  create(context) {
    return {
      Literal(node) {
        if (node.value) {
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
              fix: function (fixer) {
                const newMarkdown = baseFixer(node.value)
                return fixer.replaceTextRange(
                  [0, node.value.length - 1],
                  newMarkdown
                );
              }
            })
          }
        }
      }
    }
  }
}
