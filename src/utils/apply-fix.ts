import type { FixConfig } from '../types';

/**
 * 基于多个 fix 来修复一个字符串，关于 fix 的数据结构请查看相关类型定义
 *
 * @date 2021-12-14 15:48:27
 */
export const applyFix = (content: string, fixes: FixConfig[]) => {
  // 对所有的 fix 进行排序
  fixes.sort((a, b) => {
    return a.range[0] - b.range[0] || a.range[1] - b.range[1];
  });

  // 初始化数据
  let result = '';
  let currentIndex = Number.NEGATIVE_INFINITY;

  // 未被处理的 fix
  const notAppliedFixes: FixConfig[] = [];

  const tryApplyOneFix = (fix: FixConfig) => {
    const [start, end] = fix.range;

    // 不合法 range
    if (start > end) {
      return;
    }

    // 如果新的 fix 的起始点在当前节点的前面（这是多个 fix 重合导致的，我们会跳过它，并在下一次 fix 中尝试去 fix 它）
    if (currentIndex >= start) {
      notAppliedFixes.push(fix);
      return;
    }

    // 追加 fix range 之前的内容
    result += content.slice(currentIndex, Math.max(0, start));
    // 追加 fix 新增的文本
    result += fix.text;
    // 将当前索引指向 fix range 的末尾
    currentIndex = end;
  };

  for (const fix of fixes) {
    tryApplyOneFix(fix);
  }

  // 不要忘记追加末尾的内容
  result += content.slice(Math.max(0, currentIndex));

  return {
    result,
    notAppliedFixes
  };
};
