import type { FixConfig } from '../types';
import { FixNotAppliedReason } from '../types';

const addReason = <T extends FixConfig>(
  fix: T,
  reason: FixNotAppliedReason
): T & { reason: FixNotAppliedReason } =>
  ({ ...fix, reason }) as T & { reason: FixNotAppliedReason };

/**
 * 基于多个 fix 来修复一个字符串，关于 fix 的数据结构请查看相关类型定义
 *
 * @date 2021-12-14 15:48:27
 */
export const applyFix = <T extends FixConfig>(content: string, fixes: T[]) => {
  // 对所有的 fix 进行排序
  fixes.sort((a, b) => {
    return a.range[0] - b.range[0] || a.range[1] - b.range[1];
  });

  // 初始化数据
  let result = '';
  let currentIndex = Number.NEGATIVE_INFINITY;
  let lastAppliedWasInsertion = false;

  // 未被处理的 fix
  const notAppliedFixes: Array<T & { reason: FixNotAppliedReason }> = [];

  const tryApplyOneFix = (fix: T) => {
    const [start, end] = fix.range;

    // 不合法 range
    if (start > end) {
      return;
    }

    // A fix overlaps when it starts before the last applied range ends.
    // An insertion owns its offset. This rule keeps same-offset fixes deterministic.
    if (currentIndex > start) {
      notAppliedFixes.push(addReason(fix, FixNotAppliedReason.OVERLAP));
      return;
    }

    if (currentIndex === start && lastAppliedWasInsertion) {
      notAppliedFixes.push(addReason(fix, FixNotAppliedReason.SAME_OFFSET));
      return;
    }

    // 追加 fix range 之前的内容
    result += content.slice(currentIndex, Math.max(0, start));
    // 追加 fix 新增的文本
    result += fix.text;
    // 将当前索引指向 fix range 的末尾
    currentIndex = end;
    lastAppliedWasInsertion = start === end;
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
