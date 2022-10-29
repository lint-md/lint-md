import type { TextRange } from '../types';

/**
 * 初始化一个 fixer (修复器）
 * fixer 有很多 fix 方法，每一个 fix 方法被调用则会对一个字符串进行 fix
 * 其中每一次 fix 有以下参数：
 * - range 被替换的文本区间
 * - text 新增的文本
 */
export const createFixer = () => {
  /**
   * 将文本插入源文本中指定索引的位置
   *
   * @date 2021-12-14 14:19:40
   * @param index 索引的开始点
   * @param text 文本内容
   */
  const insertTextAt = (index: number, text: string) => {
    return {
      range: [index, index],
      text
    };
  };

  /**
   * 从某个范围之后添加文本
   *
   * @date 2021-12-14 14:29:02
   * @param range 文本范围
   * @param text 文本内容
   */
  const insertTextAfterRange = (range: TextRange, text: string) => {
    return insertTextAt(range[1], text);
  };

  /**
   * 从某个范围之前添加文本
   *
   * @date 2021-12-14 14:29:02
   * @param range 文本范围
   * @param text 文本内容
   */
  const insertTextBeforeRange = (range: TextRange, text: string) => {
    return insertTextAt(range[0], text);
  };

  /**
   * 替换某个范围的文本
   *
   * @date 2021-12-14 14:29:02
   * @param range 文本范围
   * @param text 文本内容
   */
  const replaceTextRange = (range: TextRange, text: string) => {
    return {
      range,
      text
    };
  };

  /**
   * 移除某个范围的文本
   *
   * @date 2021-12-14 14:29:02
   * @param range 文本范围
   */
  const removeRange = (range: TextRange) => {
    return {
      range,
      text: ''
    };
  };

  return {
    insertTextAt,
    insertTextAfterRange,
    insertTextBeforeRange,
    replaceTextRange,
    removeRange
  };
};
