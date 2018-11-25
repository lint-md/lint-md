const isChinese = s => {
  return /[\u4e00-\u9fa5]/.test(s);
};

const isAlphabet = s => {
  return /[a-zA-Z]/.test(s);
};

const isNumber = s => {
  return /[0-9]/.test(s);
};

// 判断是否为全角数字
const isFullwidthNumber = s => {
  return /[０-９]/.test(s);
};

/**
 * 显示从给定位置为原点，一定范围内的字符串片段
 * @param {String} s         给定字符串
 * @param {Number} index     原点位置
 * @param {Number} length    获取字符串长度
 */
const stringAround = (s, index, length) => {
  return s.substr(Math.max(index - Math.floor(length / 2), 0), length);
}

const stringType = s => {
  return isNumber(s) ? 'N' :
    isAlphabet(s) ? 'A' :
      isChinese(s) ? 'Z' : '-';
};

module.exports = {
  isChinese,
  isAlphabet,
  isNumber,
  isFullwidthNumber,
  stringType,
  stringAround
}