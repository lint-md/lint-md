import type { LintDiagnostic, LintSummary } from '../types.js';
import { RULE_SEVERITY } from '../types.js';

/**
 * 从 canonical diagnostics 派生统计摘要（#190）。
 *
 * diagnostics 是 counts 的唯一来源：顶层 fixableErrorCount / fixableWarningCount
 * 只是本函数结果的兼容投影，任何执行路径都不得独立累加 counts。
 *
 * invariant：正常诊断的 severity 不会是 OFF（OFF 的规则根本不会注册执行）。
 * 防御起见，非 ERROR/WARN 的条目在这里被忽略而不是计入任何桶。
 */
export const summarizeDiagnostics = (
  diagnostics: readonly LintDiagnostic[]
): LintSummary => {
  let errorCount = 0;
  let warningCount = 0;
  let fixableErrorCount = 0;
  let fixableWarningCount = 0;

  for (const diagnostic of diagnostics) {
    if (diagnostic.severity === RULE_SEVERITY.ERROR) {
      errorCount++;
      if (diagnostic.fixable) {
        fixableErrorCount++;
      }
    }
    else if (diagnostic.severity === RULE_SEVERITY.WARN) {
      warningCount++;
      if (diagnostic.fixable) {
        fixableWarningCount++;
      }
    }
  }

  return {
    errorCount,
    warningCount,
    fixableErrorCount,
    fixableWarningCount
  };
};
