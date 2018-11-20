const SpaceBetween = require('./space-between');
const CodeLang = require('./code-lang');
const NoEmptyUrl = require('./no-empty-url');
const NoEmptyList = require('./no-empty-list');

/**
 * 所有的 lint 规则，欢迎 pr 添加
 * @param throwError
 * @returns {*[]}
 */
module.exports = throwError => ([
  new SpaceBetween({ throwError }),
  new CodeLang({ throwError }),
  new NoEmptyUrl({ throwError }),
  new NoEmptyList({ throwError }),
]);
