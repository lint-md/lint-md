import * as _ from 'lodash';
import { LintMdDescription, LooseObject } from '../type';
import en_US from './en_US';

type DescriptionSet = typeof Descriptions

const Descriptions: LooseObject<LintMdDescription> = {
  en_US
};


/**
 * 获得规则的描述信息
 *
 * @param type 规则名称
 * @param lang 描述信息
 */
export const getDescription = (type: string, lang?: string) => {
  if (!lang) {
    lang = 'en_US';
  }

  return _.get<DescriptionSet, keyof DescriptionSet, string>(Descriptions, [lang, type]);
};
