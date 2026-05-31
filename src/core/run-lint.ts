import { parseMd } from '@lint-md/parser';
import type { LintMdRuleWithOptions } from '../types';
import { createEmitter } from '../utils/emitter';
import { createTraverser } from '../utils/traverser';
import { createRuleManager } from '../utils/rule-manager';

/**
 * 基于各种 rules 对 Markdown 文本进行校验
 *
 * @date 2021-12-12 21:48:21
 */
export const runLint = (markdown: string, allRuleConfigs: LintMdRuleWithOptions[]) => {
  // 将 markdown 转换成 ast
  const ast = parseMd(markdown);

  // 全局规则管理器
  const ruleManager = createRuleManager(markdown);

  const emitter = createEmitter();

  // 初始化遍历器，遍历时直接发射事件
  const traverser = createTraverser({
    onEnter: (node) => {
      if (node.type) {
        try {
          emitter.emit(node.type, node);
        }
        catch (e) {
          // eslint-disable-next-line no-console
          console.log(e);
        }
      }
    }
  });

  // 遍历所有的 rules，并拿到它们的选择器，为每一个选择器订阅相关事件
  for (const { rule, options } of allRuleConfigs) {
    const ruleContext = ruleManager.createRuleContext(
      { rule, options },
      {
        ast,
        markdown
      });
    const ruleSelectors = rule.create(ruleContext);
    for (const selector of Object.keys(ruleSelectors)) {
      emitter.on(selector, ruleSelectors[selector]);
    }
  }

  // 递归地遍历 ast
  traverser.traverse(ast, null);

  return {
    ruleManager
  };
};
