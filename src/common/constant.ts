/**
 * fix 模式下 lint + applyFix 的最大循环次数。
 * 防止级联 fix、冲突 fix 重试、no-op fix 等场景导致死循环。
 */
export const MAX_LINT_AND_FIX_CALL_TIMES = 10;
