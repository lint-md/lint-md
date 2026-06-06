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
 * 输出格式合同 (与 ale_linter/markdown/lint_md.vim 的解析正则有耦合)：
 *   <file>:<line>:<col>: <E|W|I> <rule-name>: <message>
 *
 * filePath 约束：handler 使用 --stdin 模式（read_buffer=1），filePath 恒为 'stdin'，
 * 不含空格。handler regex \S+ 在此假设下工作。若未来改为 file 模式且路径含空格，需同步改 handler。
 *
 * 修改此格式时，必须同步更新 VimL handler 中的正则表达式。
 *
 * @param {Array}  lintResult - lintMarkdown() 返回的 lintResult
 * @param {string} filePath   - 文件路径（或 stdin）
 * @returns {string} 格式化的诊断输出，无错误时返回空字符串
 */
function formatForAle(lintResult, filePath) {
  const lines = lintResult.map((item) => {
    const type = mapSeverity(item.severity);
    return `${filePath}:${item.loc.start.line}:${item.loc.start.column}: ${type} ${item.name}: ${item.message}`;
  });

  return lines.length ? `${lines.join('\n')}\n` : '';
}

module.exports = { formatForAle };
