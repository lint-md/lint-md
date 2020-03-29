import { Plugin } from 'ast-plugin';
import processSpaceRuleAst from './helper/space-rule';


// 匹配 [ZA, AZ]
const matches = ['ZA', 'AZ'];

/**
 * 中文和英文之间需要有空格
 * space-round-alphabet
 */
module.exports = class extends Plugin {

  static get type() {
    return 'space-round-alphabet';
  };

  pre() {}

  visitor() {
    return {
      text: ast => {
        processSpaceRuleAst(ast, matches, this.cfg.throwError);
      },
    }
  }

  post() {}
};
