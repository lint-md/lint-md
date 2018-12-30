import Text from './helper/Text';

// 中文和数字直接，增加空格
export default (markdown, error) => {
  const { ast, start, end } = error;

  return new Text(markdown)
    .removeBlock(start, end)
    .insertBlock(start.line, start.column, '……')
    .result();
};
