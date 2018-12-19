import { Plugin } from 'ast-plugin';
import processSpaceRuleAst from './helper/space-rule';

// 匹配 [ZN, NZ]
const matches = ['ZN', 'NZ'];

/**
 * 中文和数字之间需要有空格
 * space-round-number
 */
module.exports = class extends Plugin {

  static get type() {
    return 'space-round-number';
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
