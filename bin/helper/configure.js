const fs = require('fs');
const _ = require('lodash');

module.exports = configFile => {
  const file = configFile || './.lintmdrc'; // 读取默认配置文件

  let config = fs.existsSync(file) ?
    JSON.parse(fs.readFileSync(file, { encoding: 'utf8' })) :
    {};

  // 合并默认配置
  return _.merge({
    excludeFiles: ['**/node_modules/**', '**/.git/**'],
    rules: {},
  }, config);
};
