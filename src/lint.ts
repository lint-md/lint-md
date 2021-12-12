import * as unified from 'unified';
import * as remarkParse from 'remark-parse';
import { LintMdRule, NodeQueue } from './types';
import { createEmitter } from './utils/emitter';

/**
 * 基于各种 rules 对 Markdown 文本进行校验
 *
 * @date 2021-12-12 21:48:21
 */
export const lint = (markdown: string, rules: LintMdRule[]) => {
  const ast = unified()
    .use(remarkParse)
    .parse(markdown);


  // 节点队列，我们不一边遍历一边修改
  // 而是收集各节点到一个队列然后再利用发布订阅机制进行修改
  const nodeQueue: NodeQueue[] = [];

  const emitter = createEmitter();

  nodeQueue.forEach(n => {

  });
};
