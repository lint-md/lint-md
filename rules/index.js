const SpaceBetween = require('./space-between');
const NoEmptyCodeLang = require('./no-empty-code-lang');
const NoEmptyUrl = require('./no-empty-url');
const NoEmptyList = require('./no-empty-list');

/**
 * 所有的 lint 规则，欢迎 pr 添加
 * @param throwError
 * @returns {*[]}
 */
module.exports = throwError => ([
  new SpaceBetween({ throwError }),
  new NoEmptyCodeLang({ throwError }),
  new NoEmptyUrl({ throwError }),
  new NoEmptyList({ throwError }),
]);
