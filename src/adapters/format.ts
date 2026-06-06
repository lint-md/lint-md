export interface AleOutputItem {
  file: string
  line: number
  column: number
  severity: 'E' | 'W' | 'I'
  rule: string
  message: string
}

/**
 * 将 lint-markdown 结果格式化为 ALE 兼容的输出字符串。
 * ALE 解析格式: <file>:<line>:<col>: <type><code>: <message>
 */
export const formatForAle = (items: AleOutputItem[]): string => {
  return items
    .map(i => `${i.file}:${i.line}:${i.column}: ${i.severity} ${i.rule}: ${i.message}`)
    .join('\n');
};
