import { MarkdownNode } from '@lint-md/parser/lib/tmp';
import { createFixer } from './utils/fixer';
import { createRuleManager } from './utils/rule-manager';

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

export interface Fix {
  range: TextRange;
  text: string;
}

export interface ReportOption {
  message: string;
  loc: {
    start: MarkdownNodePosition;
    end: MarkdownNodePosition;
  };
  fix?: (fixer: ReturnType<typeof createFixer>) => Fix;
}

export interface LintMdRule {
  /**
   * 选择器初始化回调
   */
  create: (
    context: ReturnType<
      ReturnType<typeof createRuleManager>['createRuleContext']
    >
  ) => Record<string, (node: MarkdownNode) => void>;

  /**
   * rule 的一些基本信息，后续有需要再补充
   */
  meta?: Record<any, any>;
}

export interface LintMdRuleConfig {
  rule: LintMdRule;
  options?: Record<string, any>;
  fileName?: string;
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

export type TextRange = number[];
