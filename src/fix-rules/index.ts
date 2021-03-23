import * as _ from 'lodash';
import { LintMdFixer, PlainObject, LintMdError } from '../type';

// 引入所有的规则
import no_empty_blockquote from './no-empty-blockquote';
import no_empty_code from './no-empty-code';
import no_empty_code_lang from './no-empty-code-lang';
import use_standard_ellipsis from './use-standard-ellipsis';
import space_round_number from './space-round-number';
import space_round_alphabet from './space-round-alphabet';
import no_trailing_punctuation from './no-trailing-punctuation';
import no_special_characters from './no-special-characters';
import no_space_in_link from './no-space-in-link';
import no_space_in_inlinecode from './no-space-in-inlinecode';
import no_space_in_emphasis from './no-space-in-emphasis';
import no_multiple_space_blockquote from './no-multiple-space-blockquote';
import no_fullwidth_number from './no-fullwidth-number';
import no_empty_list from './no-empty-list';
import no_empty_url from './no-empty-url';
import no_empty_inlinecode from './no-empty-inlinecode';
import no_empty_delete from './no-empty-delete';
import space_round_inlinecode from './space-round-inlinecode';

// 规则集合
const Rules: PlainObject<LintMdFixer> = {
  'no-empty-blockquote': no_empty_blockquote,
  'no-empty-code': no_empty_code,
  'no-empty-code-lang': no_empty_code_lang,
  'no-empty-delete': no_empty_delete,
  'no-empty-inlinecode': no_empty_inlinecode,
  'no-empty-list': no_empty_list,
  'no-empty-url': no_empty_url,
  'no-fullwidth-number': no_fullwidth_number,
  'no-multiple-space-blockquote': no_multiple_space_blockquote,
  'no-space-in-emphasis': no_space_in_emphasis,
  'no-space-in-inlinecode': no_space_in_inlinecode,
  'no-space-in-link': no_space_in_link,
  'no-special-characters': no_special_characters,
  'no-trailing-punctuation': no_trailing_punctuation,
  'space-round-alphabet': space_round_alphabet,
  'space-round-number': space_round_number,
  'use-standard-ellipsis': use_standard_ellipsis,
  'space-round-inlinecode': space_round_inlinecode
};

/**
 * 处理 markdown 错误的拦截器机制
 *
 * @param markdown
 * @param error
 * @returns {*}
 */
export const fixRules = (markdown: string, error: LintMdError) => {
  const { type } = error;
  // 使用对应的规则去处理
  const func = _.get(Rules, [type]);

  if (func) {
    return func(markdown, error);
  }

  // 找不到，直接返回原始
  return markdown;
};
