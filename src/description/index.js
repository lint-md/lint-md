import _ from 'lodash';
import en_US from './en_US';

const Descriptions = {
  en_US,
};

/**
 * 获得类型的描述信息
 * @param type
 * @param lang
 */
export const getDescription = (type, lang = 'en_US') => {
  return _.get(Descriptions, [lang, type], _.get(Descriptions, ['en_US', type]));
};
