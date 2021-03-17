import * as _ from 'lodash';
import { Plugin, PluginError, PluginRuleConfig } from 'ast-plugin';
import { LintMdRulesConfig } from '../types';
import { ruleToLevel } from './helper/rule';

const PluginClasses: Plugin[] = [
  require('./space-round-alphabet'),
  require('./space-round-number'),
  require('./no-empty-code-lang'),
  require('./no-empty-delete'),
  require('./no-empty-url'),
  require('./no-empty-list'),
  require('./no-empty-code'),
  require('./no-empty-inlinecode'),
  require('./no-empty-blockquote'),
  require('./no-special-characters'),
  require('./use-standard-ellipsis'),
  require('./no-fullwidth-number'),
  require('./no-space-in-emphasis'),
  require('./no-space-in-link'),
  require('./no-multiple-space-blockquote'),
  require('./no-space-in-inlinecode'),
  require('./no-trailing-punctuation'),
  require('./no-long-code')
];


/**
 * 所有的 lint 规则，欢迎 pr 添加
 *
 * @param throwError
 * @param rules
 * @returns {*[]}
 */

type ThrowErrorFn = (LintError: PluginError) => void

export default (throwError: ThrowErrorFn, rules: LintMdRulesConfig): Plugin[] => {
  // 所有的插件的默认 rules
  const rulesConfig: { [key: string]: PluginRuleConfig } = {};

  _.forEach(PluginClasses, (Plugin) => {
    rulesConfig[Plugin.type] = {
      // 默认都是 error
      level: 2
    };
  });

  // 用 rules 覆盖初始配置
  Object.keys(rules).forEach((rule) => {
    const targetRule = rules[rule];
    // 当 targetRule 为 Array 时，分离出 level &&  config
    if (Array.isArray(targetRule)) {
      const [level, config] = targetRule;
      rulesConfig[rule] = {
        level,
        config
      };
    } else {
      rulesConfig[rule] = {
        level: targetRule,
        config: {}
      };
    }
  });

  // 配置为 0 的就是关闭，不启用插件！
  const Plugins = _.filter(PluginClasses, Plugin => rulesConfig[Plugin.type].level !== 0);

  // 初始化插件
  return _.map(Plugins, Plugin => {
    const level = ruleToLevel(rulesConfig[Plugin.type].level);

    // 重新包装一下 throw 方法，加入 level
    const throwErrorFunc = error => {
      error.level = level;
      error.type = Plugin.type;
      throwError(error);
    };

    // ast-plugin package 的基类没有定义 pre  / post 方法，
    // 但 lint 时会执行它们，如果用户没有传入就会报错，我们需要规避这种情况
    const hasPreMethod = Object.prototype.hasOwnProperty.call(Plugin.prototype, 'pre');
    const hasPostMethod = Object.prototype.hasOwnProperty.call(Plugin.prototype, 'post');

    if (!hasPreMethod) {
      Plugin.prototype.pre = () => null;
    }
    if (!hasPostMethod) {
      Plugin.prototype.post = () => null;
    }

    // TODO: remove ts-ignore
    // @ts-ignore
    return new Plugin({ throwError: throwErrorFunc, config: rulesConfig[Plugin.type].config });
  });
};
