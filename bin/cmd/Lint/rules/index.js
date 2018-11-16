const SpaceBetween = require('./space-between');
const CodeLang = require('./code-lang');

module.exports = throwError => ([
  new SpaceBetween({ throwError }),
  new CodeLang({ throwError }),
]);
