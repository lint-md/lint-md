const _ = require('lodash');

const ruleHelper = require('./helper/rule');

const PluginClasses = [
  require('./space-round-alphabet'),
  require('./space-round-number'),
  require('./no-empty-code-lang'),
  require('./no-empty-url'),
  require('./no-empty-list'),
  require('./no-empty-code'),
  require('./no-empty-blockquote'),
  require('./no-special-characters'),
  require('./use-standard-ellipsis'),
  require('./no-fullwidth-number'),
  require('./no-space-in-emphasis'),
  require('./no-space-in-link')
];



/**
 * 所有的 lint 规则，欢迎 pr 添加
 * @param throwError
 * @param rules
 * @returns {*[]}
 */
module.exports = (throwError, rules) => {
  // 所有的插件的默认 rules
  const initialRules = {};

  _.forEach(PluginClasses, Plugin => {
    initialRules[Plugin.type] = 2; // 默认都是 error
  });

  // 用 rules 覆盖初始配置
  const rulesConfig = _.merge({}, initialRules, rules);

  // 配置为 0 的就是关闭，不启用插件！
  const Plugins = _.filter(PluginClasses, Plugin => rulesConfig[Plugin.type] !== 0);

  // 初始化插件
  return _.map(Plugins, Plugin => {
    const level = ruleHelper.ruleToLevel(rulesConfig[Plugin.type]);

    // 重新包装一下 throw 方法，加入 level
    const throwErrorFunc = error => {
      error.level = level;
      error.type = Plugin.type;
      throwError(error);
    };

    return new Plugin({ throwError: throwErrorFunc });
  });
};
