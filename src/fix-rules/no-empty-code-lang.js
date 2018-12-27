import Text from './helper/Text'
import _ from 'lodash';

export default (markdown, error) => {
  const { ast  } = error;

  const { position } = ast.node;
  const { start, end } = position;

  const { line } = start;

  const text = new Text(markdown);

  // 获得当前行
  const lineText = text.getLine(line);

  // 将当前行替换成带语言的文本
  return new Text(markdown)
    .spliceLines(line, 1, `${_.trimEnd(lineText)}plain`)
    .result();
};
