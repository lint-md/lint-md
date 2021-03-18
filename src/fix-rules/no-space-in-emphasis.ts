import * as _ from 'lodash';
import Text from '../helper/Text';

export default (markdown, error) => {
  const { ast } = error;

  const { position } = ast.node;
  const { start, end } = position;

  const string = ast.segment();

  const newString = `**${_.trim(string, '* ')}**`;

  return new Text(markdown)
    .removeBlock(start, end)
    .insertBlock(start.line, start.column, newString)
    .result();
};
