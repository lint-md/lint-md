const path = require('path');
const fs = require('fs');

const { fix, version } = require('../../lib');

/**
 * 使用 ast 和规则进行 fix
 * @param f
 * @param config
 * @returns {Promise<any>}
 */
module.exports = (f, config) => {
  const { rules } = config;

  return new Promise((resolve, reject) => {
    const file = path.resolve(f);
    const markdown = fs.readFileSync(file, { encoding: 'utf8' });

    // 修复之后的 markdown
    const newMarkdown = fix(markdown, rules);

    // 如果不相同，那么保存回去
    if (newMarkdown !== markdown) {
      fs.writeFileSync(file, newMarkdown, { encoding: 'utf8' });
      resolve(true);
    } else {
      resolve(false);
    }
  })
};
