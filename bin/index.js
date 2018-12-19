#!/usr/bin/env node

const { h, render } = require('ink');
const program = require('commander');

const pkg = require('../package.json');
const Lint = require('./Lint');
const Fix = require('./Fix');
const configure = require('./helper/configure');

let unmount;

const onExit = error => {
  setTimeout(() => {
    unmount();
    process.exit(error);
  }, 0);
};

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
      unmount = render(h(Fix, { files, config, onExit }));
    } else {
      unmount = render(h(Lint, { files, config, onExit }));
    }
  });

program.parse(process.argv);

if (!program.args.length) {
  program.help();
}
