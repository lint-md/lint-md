import _ from 'lodash';
import Text from './helper/Text';
import { getLastChildLeaf } from './helper/ast';

const Symbols = '.,;:!?。，；：！？…~*`';

export default (markdown, error) => {
  const { ast } = error;

  const last = getLastChildLeaf(ast.node);

  // 正常情况，最后一个都是 text 类型的
  const { value, position } = last;

  const { start, end } = position;

  const newString = _.trimEnd(value, Symbols);

  return new Text(markdown)
    .removeBlock(start, end)
    .insertBlock(start.line, start.column, newString)
    .result();
};
