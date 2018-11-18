const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const unified = require('unified');
const markdown = require('remark-parse');
const { Ast } = require('ast-plugin');

const plugins = require('../../rules');

/**
 * 使用 ast 和插件进行 lint
 * @param f
 * @param config
 * @returns {Promise<any>}
 */
module.exports = (f, config) => {

  return new Promise((resolve, reject) => {
    const errors = [];

    const throwFunc = error => {
      errors.push(error);
    };

    const file = path.resolve(f);
    const md = fs.readFileSync(file, { encoding: 'utf8' });

    const ast = unified()
      .use(markdown)
      .parse(md);

    // 处理 plugin 规则
    new Ast(ast).traverse(plugins(throwFunc));

    const e = _.uniqWith(errors, _.isEqual); // 去重

    const r = e.length > 0 ? [{
      path: path.dirname(file),
      file: path.basename(file),
      errors: e, // 去重
    }] : [];

    resolve(r);
  })
};
