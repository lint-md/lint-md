import { parseMd } from '@lint-md/parser';
import type { LintMdRuleWithOptions, NodeQueue } from '../types';
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

  // 节点队列，遍历到的节点都会被推入这里
  const nodeQueue: NodeQueue[] = [];

  // 全局规则管理器
  const ruleManager = createRuleManager(markdown);

  // 初始化遍历器，对于每一个节点的进入和退出，都将其推入到上面的 nodeQueue 队列中，供后续处理
  const traverser = createTraverser({
    onEnter: (node) => {
      nodeQueue.push({
        isEntering: true,
        node
      });

      nodeQueue.push({
        isEntering: false,
        node
      });
    }
  });

  const emitter = createEmitter();

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

  // 遍历节点队列，执行对应的选择器
  for (const nodeQueueItem of nodeQueue) {
    const { node, isEntering } = nodeQueueItem;

    try {
      if (isEntering && node.type) {
        emitter.emit(node.type, node);
      }
    }
    catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
  }

  return {
    ruleManager
  };
};
