import * as unified from 'unified';
import * as remarkParse from 'remark-parse';
import { LintMdRule, MarkdownNode, NodeQueue } from './types';
import { createEmitter } from './utils/emitter';
import { createTraverser } from './utils/traverser';
import { createRuleContext } from './utils/rule-context';


/**
 * 基于各种 rules 对 Markdown 文本进行校验
 *
 * @date 2021-12-12 21:48:21
 */
export const lint = (markdown: string, rules: LintMdRule[]) => {
  // 将 markdown 转换成 ast
  const ast = unified()
    .use(remarkParse)
    .parse(markdown) as MarkdownNode;

  // 节点队列，遍历到的节点都会被推入这里
  const nodeQueue: NodeQueue[] = [];

  // 全局规则上下文
  const ruleContext = createRuleContext();

  // 初始化遍历器，对于每一个节点的进入和退出，都将其推入到上面的 nodeQueue 队列中，供后续处理
  const traverser = createTraverser({
    onEnter: (node) => {
      nodeQueue.push({
        isEntering: true,
        node: node
      });

      nodeQueue.push({
        isEntering: false,
        node: node
      });
    }
  });

  const emitter = createEmitter();

  // 遍历所有的 rules，并拿到它们的选择器，为每一个选择器订阅相关事件
  for (const rule of rules) {
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
    } catch (e) {
      console.log(e);
    }
  }
};
