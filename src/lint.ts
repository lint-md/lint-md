import * as unified from 'unified';
import * as remarkParse from 'remark-parse';
import { LintMdRule, MarkdownNode, NodeQueue } from './types';
import { createEmitter } from './utils/emitter';
import { createTraverser } from './utils/traverser';


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
    // const ruleSelectors = rule.create();
  }


  traverser.traverse(ast, null);
};
