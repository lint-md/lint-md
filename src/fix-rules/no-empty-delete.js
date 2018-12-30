import Text from './helper/Text';

export default (markdown, error) => {
  const { ast } = error;

  const { position } = ast.node;
  const { start, end } = position;

  return new Text(markdown).removeBlock(start, end).result();
};
