import * as _ from 'lodash';
import { lint } from './lint';
import rules from './fix-rules';

export const fix = (markdown, rulesConfig = {}) => {
  let newMarkdown = markdown;

  let retryMax = 20;

  let errorCnt = Infinity; // 最大值

  // 循环 lint，每次只修复第一个错误，直到修复完；todo 可以优化为每次修改一行
  // 为什么要循环 lint，因为每次修复错误，都会导致其他的错误位置产生偏移
  while (true) {
    const errors = lint(newMarkdown, rulesConfig, true);
    const newErrorCnt = errors.length;

    // 没有错误，终止处理
    if (newErrorCnt === 0) {
      break;
    } else if (newErrorCnt >= errorCnt) {
      // 或者错误数量变多了，或者变多的次数超过一定的数额
      retryMax--;
      if (retryMax <= 0) {
        break;
      }
    }

    // 如果存在错误，则处理第一个
    // const e = errors[0];
    // 随机处理
    const e = errors[_.random(newErrorCnt - 1)];
    newMarkdown = rules(newMarkdown, e);

    errorCnt = newErrorCnt;
  }
  return newMarkdown;
};
