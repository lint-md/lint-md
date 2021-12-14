import { Parent } from 'unist';

export interface MarkdownNodePosition {
  /**
   * 所在行（索引从 1 开始）
   */
  line: number;

  /**
   * 所在列（索引从 1 开始）
   */
  column: number;
}

export interface Fixer {

}

export type MarkdownNode = Omit<Parent, 'children'> & {
  children?: MarkdownNode[]
};

export interface ReportOption {
  message: string;
  loc: {
    start: MarkdownNodePosition;
    end: MarkdownNodePosition;
  };
  fix?: (fixer: Fixer) => void;
}

// 每一个 rule 的上下文，一般从 create 方法的回调函数中拿到
// rule 可以调用其中的 report 方法来报告 lint error 或者 warning
export interface RuleContext {
  report: (option: ReportOption) => void;
  getReportData: () => ReportOption[];
}

export interface LintMdRule {
  // 选择器初始化回调
  create: (context: RuleContext) => Record<string, (node: MarkdownNode) => void>;
  // rule 的一些基本信息
  meta: {
    // 是否可修复
    fixable: boolean;
  };
}

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

export type TextRange = [number, number]
