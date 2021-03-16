import * as _ from 'lodash';
import Text from '../helper/Text';

const FullwidthNumberMap = {
  '１': 1,
  '２': 2,
  '３': 3,
  '４': 4,
  '５': 5,
  '６': 6,
  '７': 7,
  '８': 8,
  '９': 9,
  '０': 0,
};

export default (markdown, error) => {
  const { ast } = error;
  const { position } = ast.node;
  const { start, end } = position;

  const string = ast.segment();

  const newString = string
    .split('')
    .map(s => `${_.get(FullwidthNumberMap, s, s)}`)
    .join('');

  return new Text(markdown)
    .removeBlock(start, end)
    .insertBlock(start.line, start.column, newString)
    .result();
};
