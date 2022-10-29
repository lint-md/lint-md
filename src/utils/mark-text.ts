import { isChineseCharacter, isEnglishCharacter, isNumberCharacter } from './char-helper';

/**
 * 将字符串抽象成标记字符，这对于中英文、标点相关的文本处理都有好处
 *
 * 你好世界 hello world!!! -> ZZZZAAAAA-AAAAA---
 *
 * @author YuZhanglong <loveyzl1123@gmail.com>
 */
export const markText = (text: string) => {
  const res = text.split('').map((value) => {
    if (isNumberCharacter(value)) {
      return 'N';
    }
    else if (isChineseCharacter(value)) {
      return 'Z';
    }
    else if (isEnglishCharacter(value)) {
      return 'A';
    }
    else {
      return '-';
    }
  });
  return res.join('');
};
