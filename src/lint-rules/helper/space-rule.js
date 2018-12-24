const { stringType, subErrorStr } = require('./string');

export default (ast, matches, cb) => {
  const text = ast.node.value;

  const line = ast.node.position.start.line;
  const column = ast.node.position.start.column;

  const typeText = text.split('').map(s => stringType(s)).join('');

  for (let i = 0; i < typeText.length; i ++) {
    const s = typeText.substr(i, 2);

    if (matches.indexOf(s) !== -1) {
      // 存在则抛出去
      cb({
        start: {
          line,
          column: column + i + 1
        },
        end: {
          line,
          column: column + i + 2
        },
        text: `'${subErrorStr(text, i, 12)}'`, // substring 12 个字符
        ast,
      });
    }
  }
};
