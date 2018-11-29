const isChinese = s => {
  return /^[\u4e00-\u9fa5]{1}$/.test(s);
};

const isAlphabet = s => {
  return /^[a-zA-Z]{1}$/.test(s);
};

const isNumber = s => {
  return /^[0-9]{1}$/.test(s);
};

/**
 * 将字符映射成标记字符
 * @param s
 * @returns {string}
 */
const stringType = s => {
  return isNumber(s) ? 'N' :
    isAlphabet(s) ? 'A' :
      isChinese(s) ? 'Z' : '-';
};

/**
 * 显示从给定位置为原点，一定范围内的字符串片段
 * @param {String} s         给定字符串
 * @param {Number} index     原点位置
 * @param {Number} length    获取字符串长度
 */
const subErrorStr = (s, index, length) => {
  return s.substr(Math.max(index - Math.floor(length / 2), 0), length);
};

const substr = (s, len = 12) => {
  if (!s) return s;

  return s.length > len ? `${s.substr(0, len)}...` : s;
};

module.exports = {
  stringType,
  subErrorStr,
  substr,
};
