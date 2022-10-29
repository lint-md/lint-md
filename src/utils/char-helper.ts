export const isNumberCharacter = (value: string) => {
  return /^[0-9]$/.test(value);
};

export const isChineseCharacter = (value: string) => {
  return /^[\u4E00-\u9FA5]$/.test(value);
};

export const isEnglishCharacter = (value: string) => {
  return /^[a-zA-Z]$/.test(value);
};
