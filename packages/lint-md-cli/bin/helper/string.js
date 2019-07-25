exports.rightPad = (s, len, c = ' ') => {
  let i = -1;
  const length = len - s.length;

  let str = s;
  while (++i < length) {
    str += c;
  }

  return str;
};
