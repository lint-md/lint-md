import { lint } from './lint';
import rules from './fix-rules';

export const fix = (markdown, rulesConfig = {}) => {
  let newMarkdown = markdown;

  let errorCnt = Infinity;

  // 循环 lint，每次只修复第一个错误，知道修复完；todo 可以优化为每次修改一行
  // 为什么要循环 lint，因为每次修复错误，都会导致其他的错误位置产生偏移
  while (true) {
    const errors = lint(newMarkdown, rulesConfig, true);
    const newErrorCnt = errors.length;

    // 没有错误，终止处理
    if (newErrorCnt === 0) {
      break;
    } else if (newErrorCnt >= errorCnt) {
      // 或者错误数量变多了
      // console.warn('errors did not decrease!');
      break;
    } else {
      // 如果存在错误，则处理第一个
      newMarkdown = rules(newMarkdown, errors[0]);
    }

    errorCnt = newErrorCnt;
  }

  return newMarkdown;
};
