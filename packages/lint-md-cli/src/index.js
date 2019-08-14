#!/usr/bin/env node

require('babel-polyfill');

const program = require('commander');

const Lint = require('./Lint');
const Fix = require('./Fix');
const configure = require('./helper/configure');

program
  .version(__VERSION__, '-v, --version')
  .usage('<lint-md> <files...> [options]')
  .description('lint your markdown files')
  .option('-c, --config [configure-file]', 'use the configure file, default .lintmdrc')
  .option('-f, --fix', 'fix the errors automatically')
  .arguments('<files...>')
  .action((files, cmd) => {
    const config = configure(cmd.config);
    const fix = cmd.fix;

    if (fix) {
      new Fix(files, config);
    } else {
      new Lint(files, config);
    }
  });

program.parse(process.argv);

if (!program.args.length) {
  program.help();
}
