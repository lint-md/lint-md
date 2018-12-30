import Text from './helper/Text'
import _ from 'lodash';

export default (markdown, error) => {
  const { ast } = error;

  const { position } = ast.node;
  const { start, end } = position;

  const { line } = start;

  const text = new Text(markdown);

  // 获得当前行
  const lineText = text.getLine(line);

  const replaceText = `${_.trimEnd(lineText)}plain`;

  // 将当前行替换成带语言的文本
  return new Text(markdown)
    .removeLine(line) // 删除
    .insertLines(line - 1, replaceText).result(); // 插入
};
