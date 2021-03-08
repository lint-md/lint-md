const rules = require('./rules/index')
module.exports = {
  processors: {
    ".md": {
      preprocess: function (text) {
        return [text];
      },
      postprocess: function (messages) {
        return messages[0];
      }
    }
  },
  rules: rules
}