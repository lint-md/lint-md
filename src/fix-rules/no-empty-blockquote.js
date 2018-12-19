import Text from './helper/Text'

export default (markdown, error) => {
  const { ast, text, start, end } = error;

  // 删除这一行即可
  return new Text(markdown).removeLine(start.line - 1).result();
};
