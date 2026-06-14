import type { LintDiagnostic } from './types';

/**
 * 将标准诊断格式转为 ALE (Vim/Neovim) 兼容的输出字符串
 *
 * 输出格式：
 *   <file>:<line>:<col>: <E|W|I> <ruleId>: <message>
 *
 * @param diagnostics 标准诊断列表
 * @param filePath    文件路径
 * @returns ALE 格式字符串，无诊断时返回空字符串
 */
export function toALEOutput(diagnostics: LintDiagnostic[], filePath: string): string {
  const lines = diagnostics.map((d) => {
    const type = d.severity === 2 ? 'E' : d.severity === 1 ? 'W' : 'I';
    return `${filePath}:${d.line}:${d.column}: ${type} ${d.ruleId}: ${d.message}`;
  });
  return lines.length ? `${lines.join('\n')}\n` : '';
}
