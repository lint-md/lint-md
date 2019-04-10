const path = require('path');
const fs = require('fs');

const { lint, fix, version } = require('../../lib');

/**
 * 使用 ast 和插件进行 lint
 * @param f
 * @param config
 * @returns {Promise<any>}
 */
module.exports = (f, config) => {

  const { rules } = config;

  return new Promise((resolve, reject) => {
    const file = path.resolve(f);
    const markdown = fs.readFileSync(file, { encoding: 'utf8' });

    const errors = lint(markdown, rules);

    resolve({
      path: path.dirname(file),
      file: path.basename(file),
      errors, // 去重
    });
  })
};
