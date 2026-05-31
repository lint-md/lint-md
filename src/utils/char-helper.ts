const NUMBER_RE = /^[0-9]$/;
const CHINESE_RE = /^[\u4E00-\u9FA5]$/;
const ENGLISH_RE = /^[a-zA-Z]$/;

export const isNumberCharacter = (value: string) => NUMBER_RE.test(value);
export const isChineseCharacter = (value: string) => CHINESE_RE.test(value);
export const isEnglishCharacter = (value: string) => ENGLISH_RE.test(value);
