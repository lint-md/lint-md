export const isNumberCharacter = (value: string) => {
  return /^[0-9]$/.test(value);
};

export const isChineseCharacter = (value: string) => {
  return /^[\u4e00-\u9fa5]$/.test(value);
};

export const isEnglishCharacter = (value: string) => {
  return /^[a-zA-Z]$/.test(value);
};
