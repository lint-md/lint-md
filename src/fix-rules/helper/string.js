import _ from 'lodash';
import { stringType } from '../../lint-rules/helper/string';

const matches = [
  'ZA', 'AZ', // 中文和英文
  'ZN', 'NZ', // 中文和数字
];

const splice = (s, start, deleteCount, ...strings) => {
  const arr = s.split('');
  arr.splice(start, deleteCount, ...strings);
  return arr.join('');
};

export const insertSpace = string => {
  let tmp = string;

  for (let i = 0; i < tmp.length; i ++) {
    const s = stringType(tmp.substr(i, 2));
    // 匹配到
    if (_.includes(matches, s)) {
      tmp = splice(tmp, i + 1, 0, ' ');
    }
  }
  return tmp;
};
