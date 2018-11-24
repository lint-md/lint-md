const isChinese = s => {
  return /[\u4e00-\u9fa5]/.test(s);
};

const isAlphabet = s => {
  return /[a-zA-Z]/.test(s);
};

const isNumber = s => {
  return /[0-9０-９]/.test(s);
};

// 判断是否为全角
const isFullwidth = s => {
  return /[\uff00-\uffff]/.test(s);
}

// 判断是否为全角数字
const isFullwidthNumber = s => {
  return /[０-９]/.test(s);
};


const stringType = s => {
  return isNumber(s) ? 'N' :
    isAlphabet(s) ? 'A' :
      isChinese(s) ? 'Z' : '-';
};

module.exports = {
  isChinese,
  isAlphabet,
  isNumber,
  isFullwidth,
  isFullwidthNumber,
  stringType
}