import _ from 'lodash';
import Text from './helper/Text';
import { getChildrenPosition } from './helper/ast';

export default (markdown, error) => {
  const { ast } = error;
  const textPosition = getChildrenPosition(ast);
  const { start, end } = textPosition;

  const text = new Text(markdown);

  const string = text.getBlock(start, end);

  const newString = _.trim(string);

  return new Text(markdown)
    .removeBlock(start, end)
    .insertBlock(start.line, start.column, newString)
    .result();
};
