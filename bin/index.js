#!/usr/bin/env node

const { h, render } = require('ink');
const program = require('commander');

const pkg = require('../package.json');
const Lint = require('./Lint');
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
  .arguments('<files...>')
  .action((files, cmd) => {
    const config = configure(cmd.config);
    unmount = render(h(Lint, { files, config, onExit }));
  });

program.parse(process.argv);

if (!program.args.length) {
  program.help();
}
