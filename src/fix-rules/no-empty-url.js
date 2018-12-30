import _ from 'lodash';
import Text from './helper/Text';

export default (markdown, error) => {
  const { ast  } = error;
  const { position, type } = ast.node;
  const { start, end } = position;

  const text = new Text(markdown);

  let md = '';

  if (type === 'image') {
    const { alt } = ast.node;
    md = `![${alt}](.)`;
  } else {
    // type === 'link'
    const title = _.get(ast.node, 'children[0].value', '');
    md = `[${title}](.)`;
  }

  // 删除原来的块
  text.removeBlock(start, end);

  // 添加新的 markdown 片段
  text.insertBlock(start.line, start.column, md);

  return text.result();
};
