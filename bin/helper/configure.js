const fs = require('fs');
const _ = require('lodash');
const chalk = require('chalk');

const getConfig = file => {
  let config;
  try {
    config = JSON.parse(fs.readFileSync(file, { encoding: 'utf8' }));
  } catch (e) {
    // 不存在配置文件、配置文件不是 json，配置为空！
    config = {};
  }

  return _.merge({
    excludeFiles: ['**/node_modules/**', '**/.git/**'],
    rules: {},
  }, config);
};

module.exports = configFile => {
  if (configFile && !fs.existsSync(configFile)) {
    console.log(chalk.red(`lint-md: Configure file '${configFile}' is not exist.`));
    process.exit(1);
  }

  return getConfig(configFile || './.lintmdrc')
};
