import Text from '../helper/Text';
import { insertSpace } from './helper/string';

// 中文和英文直接，增加空格
export default (markdown, error) => {
  const { ast } = error;
  const { position } = ast.node;
  const { start, end } = position;

  const string = ast.segment();

  // 插入空格
  const newString = insertSpace(string);

  return new Text(markdown)
    .removeBlock(start, end)
    .insertBlock(start.line, start.column, newString)
    .result();
};
