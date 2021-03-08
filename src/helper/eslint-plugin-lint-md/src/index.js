const rules = require('./rules/index')
module.exports = {
  processors: {
    ".md": {
      preprocess: function (text) {
        return [text];
      },
      postprocess: function (messages) {
        return messages.flat();
      },
      supportsAutofix: true
    }
  },
  rules: rules
}