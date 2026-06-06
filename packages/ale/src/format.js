function mapSeverity(severity) {
  switch (severity) {
    case 2:
      return 'E';
    case 1:
      return 'W';
    default:
      return 'I';
  }
}

/**
 * 将 lintMarkdown() 返回的 lintResult 格式化为 ALE 兼容的输出字符串。
 *
 * ALE 解析格式: <file>:<line>:<col>: <type> <code>: <message>
 *
 * @param {Array}  lintResult - lintMarkdown() 返回的 lintResult
 * @param {string} filePath   - 文件路径（或 stdin）
 * @returns {string} ALE 格式的错误信息，无错误时返回空字符串
 */
function formatForAle(lintResult, filePath) {
  const lines = lintResult.map((item) => {
    const type = mapSeverity(item.severity);
    return `${filePath}:${item.loc.start.line}:${item.loc.start.column}: ${type} ${item.name}: ${item.message}`;
  });

  return lines.length ? `${lines.join('\n')}\n` : '';
}

module.exports = { formatForAle };
