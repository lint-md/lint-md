#!/usr/bin/env node

const program = require('commander');

const pkg = require('../package.json');
const Lint = require('./Lint');
const Fix = require('./Fix');
const configure = require('./helper/configure');

program
  .version(pkg.version, '-v, --version')
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
