import Text from './helper/Text';

const SpecialCharacters = ['\b'];

export default (markdown, error) => {
  const { ast } = error;

  const { position } = ast.node;
  const { start, end } = position;

  const string = ast.segment();

  const newString = string.split('')
    .filter(s => SpecialCharacters.indexOf(s) === -1)
    .join('');

  // 删除这一个代码块即可
  return new Text(markdown)
    .removeBlock(start, end)
    .insertBlock(start.line, start.column, newString)
    .result();
};
