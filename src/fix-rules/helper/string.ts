import * as _ from 'lodash';
import { stringType } from '../../lint-rules/helper/string';

const matches = [
  // 中文和英文
  'ZA', 'AZ',

  // 中文和数字
  'ZN', 'NZ'
];

const splice = (s: string, start: number, deleteCount: number, ...strings: string[]) => {
  const arr = s.split('');
  arr.splice(start, deleteCount, ...strings);
  return arr.join('');
};

export const insertSpace = (string: string) => {
  let tmp = string;

  for (let i = 0; i < tmp.length; i++) {
    const s = stringType(tmp.substr(i, 2));
    // 匹配到
    if (_.includes(matches, s)) {
      tmp = splice(tmp, i + 1, 0, ' ');
    }
  }
  return tmp;
};
