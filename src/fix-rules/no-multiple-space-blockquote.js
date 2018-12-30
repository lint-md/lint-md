import _ from 'lodash';
import Text from './helper/Text';

export default (markdown, error) => {
  const { ast } = error;

  const { position } = ast.node;
  const { start } = position;

  const { line } = start;

  const text = new Text(markdown);

  // 当前行
  let lineText = text.getLine(line);

  // 获得 > 之后的文本
  lineText = lineText.substring(lineText.indexOf('>') + 1);

  // 拼接文本
  lineText = `> ${_.trim(lineText)}`;

  return text
    .removeLine(line) // 删除
    .insertLines(line - 1, lineText)  // 插入
    .result();
};
