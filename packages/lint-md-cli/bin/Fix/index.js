const chalk = require('chalk');
const loadMdFiles = require('../helper/file');
const fix = require('./fix');

const log = console.log;

/**
 * Fix 组件
 * @type {module.Fix}
 */
module.exports = class Fix {

  constructor(files, config) {
    this.files = files;
    this.config = config;

    this.start();
  }

  async start() {
    const mdFiles = await loadMdFiles(this.files, this.config);

    for (const file of mdFiles) {
      const rewrite = await fix(file, this.config);

      // 重新过的，才加进去
      if (rewrite) {
        this.printFile(file);
      }
    }

    // 退出
    process.exit(0);
  }

  printFile(file) {
    log(chalk.green(file));
  }
};
