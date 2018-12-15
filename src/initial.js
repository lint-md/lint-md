import { Ast } from 'ast-plugin';

Ast.prototype.getSpec = function() {
  const { start, end } = this.node.position;

  const lines = this.text.split('\n');

  // 相同行
  if (start.line === end.line) {
    return lines[start.line - 1].substring(start.column - 1, end.column - 1);
  }

  // 不同行，截取多行
  const startLine = line[start.line - 1];
  const endLine = line[end.line - 1];

  return `${startLine.substring(start.column - 1)}\n${endLine.substring(0, end.column - 1)}`;
};
