import Text from './helper/Text'

export default (markdown, error) => {
  const { ast  } = error;

  const { position } = ast.node;
  const { start } = position;

  // 删除这一行即可
  return new Text(markdown).removeLine(start.line).result();
};
