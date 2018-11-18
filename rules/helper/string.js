const isChinese = s => {
  return /[\u4e00-\u9fa5]/.test(s);
};

const isAlphabet = s => {
  return /[a-zA-Z]/.test(s);
};

const isNumber = s => {
  return /[0-9]/.test(s);
};

exports.stringType = s => {
  return isNumber(s) ? 'N' :
    isAlphabet(s) ? 'A' :
      isChinese(s) ? 'Z' : '-';
};
