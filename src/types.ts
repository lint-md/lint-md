import { Parent } from 'unist';

export interface LintMdRule {
  // TODO
  todo: string;
}


export type MarkdownNode = Omit<Parent, 'children'> & {
  children?: MarkdownNode[]
};

// 节点队列
export interface NodeQueue {
  node: MarkdownNode;
  isEntering: boolean;
}

// 遍历器的相关选项
export interface TraverserOptions {
  // 在节点进入时做些什么
  onEnter?: (node: MarkdownNode, parent: MarkdownNode) => void;

  // 在节点退出时做些什么
  onLeave?: (node: MarkdownNode, parent: MarkdownNode) => void;
}
