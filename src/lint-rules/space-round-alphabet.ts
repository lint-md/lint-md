import { Plugin } from '@lint-md/ast-plugin';
import processSpaceRuleAst from './helper/space-rule';

// 匹配 [ZA, AZ]
const matches = ['ZA', 'AZ'];

/**
 * 中文和英文之间需要有空格
 * space-round-alphabet
 */
export default class extends Plugin {
  static get type() {
    return 'space-round-alphabet';
  }

  visitor() {
    return {
      text: ast => {
        processSpaceRuleAst(ast, matches, this.cfg.throwError);
      }
    };
  }

  pre() {
  }

  post() {
  }
}
