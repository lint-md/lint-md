/**
 * lint & fix 最大执行的次数
 * 这个限制的意义是在 fix 模式下，如果有多个 fix 出现了冲突，我们的逻辑是只取第一个，剩下的再次调用 lint + fix 并重复执行，但这很有可能造成死循环
 * 解决方案就是增加一个递归出口，即这里的最大执行次数
 */
export const MAX_LINT_AND_FIX_CALL_TIMES = 10;
