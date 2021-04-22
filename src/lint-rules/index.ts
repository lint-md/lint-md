import * as _ from 'lodash';
import { Plugin } from '@lint-md/ast-plugin';
import { LintMdRulesConfig, PlainObject, LintMdError, RuleLevel } from '../type';
import { ruleToLevel } from './helper/rule';
import space_round_alphabet from './space-round-alphabet';
import space_round_number from './space-round-number';
import no_empty_code_lang from './no-empty-code-lang';
import no_empty_delete from './no-empty-delete';
import no_empty_url from './no-empty-url';
import no_empty_list from './no-empty-list';
import no_empty_code from './no-empty-code';
import no_empty_inlinecode from './no-empty-inlinecode';
import no_empty_blockquote from './no-empty-blockquote';
import no_special_characters from './no-special-characters';
import use_standard_ellipsis from './use-standard-ellipsis';
import no_fullwidth_number from './no-fullwidth-number';
import no_space_in_emphasis from './no-space-in-emphasis';
import no_space_in_link from './no-space-in-link';
import no_multiple_space_blockquote from './no-multiple-space-blockquote';
import no_space_in_inlinecode from './no-space-in-inlinecode';
import no_trailing_punctuation from './no-trailing-punctuation';
import no_long_code from './no-long-code';
import space_round_inlinecode from './space-round-inlinecode';

const PluginClasses = [
  space_round_alphabet,
  space_round_number,
  no_empty_code_lang,
  no_empty_delete,
  no_empty_url,
  no_empty_list,
  no_empty_code,
  no_empty_inlinecode,
  no_empty_blockquote,
  no_special_characters,
  use_standard_ellipsis,
  no_fullwidth_number,
  no_space_in_emphasis,
  no_space_in_link,
  no_multiple_space_blockquote,
  no_space_in_inlinecode,
  no_trailing_punctuation,
  no_long_code,
  space_round_inlinecode
];


/**
 * 所有的 lint 规则，欢迎 pr 添加
 *
 * @param throwError
 * @param rules
 * @returns {*[]}
 */

type ThrowErrorFn = (LintError: LintMdError) => void


interface PluginRuleConfig {
  level?: RuleLevel;
  config?: PlainObject;
}

export default (throwError: ThrowErrorFn, rules: LintMdRulesConfig): Plugin[] => {
  // 所有的插件的默认 rules
  const rulesConfig: PlainObject<PluginRuleConfig> = {};

  _.forEach(PluginClasses, (Plugin) => {
    rulesConfig[Plugin.type] = {
      // 默认都是 error
      level: 2
    };
  });

  // 用 rules 覆盖初始配置
  Object.keys(rules).forEach((rule) => {
    const [level, config] = [].concat(rules[rule]);
    rulesConfig[rule] = {
      level,
      config
    };
  });

  // 配置为 0 的就是关闭，不启用插件！
  const Plugins = _.filter(PluginClasses, Plugin => rulesConfig[Plugin.type].level !== 0);

  // 初始化插件
  return _.map(Plugins, Plugin => {
    const level = ruleToLevel(rulesConfig[Plugin.type].level);

    // 重新包装一下 throw 方法，加入 level
    const throwErrorFunc = (error: LintMdError) => {
      error.level = level;
      error.type = Plugin.type;
      throwError(error);
    };

    // @ts-ignore
    return new Plugin({ throwError: throwErrorFunc, config: rulesConfig[Plugin.type].config });
  });
};
