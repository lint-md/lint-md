const {lint, getDescription} = require('lint-md')

module.exports = {
  meta: {
    messages: {
      invalidName: 'TODO'
    }
  },
  create(context) {
    return {
      Literal(node) {
        if (node.value) {
          const errors = lint(node.value, ['$MD_LINT_RULE_NAME$']);
          for (let err of errors) {
            const describe = getDescription(err.type)
            context.report({
              message: describe.message,
              loc: {
                start: err.start,
                end: err.end
              },
            })
          }
        }
      }
    }
  }
}
