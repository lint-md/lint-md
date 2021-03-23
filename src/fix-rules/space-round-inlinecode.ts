import Text from '../helper/Text';

// 中文和英文直接，增加空格
export default (markdown, error) => {
  const { ast } = error;
  const { position } = ast.node;
  const { start, end } = position;

  const text = error.text as string;
  // 插入空格

  return new Text(markdown)
    .removeBlock(start, end)
    .insertBlock(start.line, start.column, text)
    .result();
};
