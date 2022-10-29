import type { MarkdownNode, MarkdownNodePosition } from '@lint-md/parser';
import type { createFixer } from './utils/fixer';
import type { createRuleManager } from './utils/rule-manager';

/** 文本范围信息 */
export type TextRange = number[];

/** 修复器配置 */
export interface FixConfig {
  /**
   * 范围
   */
  range: TextRange

  /**
   * 文本
   */
  text: string

  /**
   * 本次修复的额外信息
   */
  data?: any
}

/** 上报信息配置 */
export interface ReportOption {
  name: string
  content: string
  message: string
  loc: {
    start: MarkdownNodePosition
    end: MarkdownNodePosition
  }
  fix?: (fixer: ReturnType<typeof createFixer>) => FixConfig
}

/** rules 上下文 */
export type LintMdRuleContext = ReturnType<ReturnType<typeof createRuleManager>['createRuleContext']>;

/** rule */
export interface LintMdRule {
  /**
   * 选择器初始化回调
   */
  create: (context: LintMdRuleContext) => Record<string, (node: MarkdownNode) => void>

  /**
   * rule 的一些基本信息，后续有需要再补充
   */
  meta: {
    name: string
  }
}

/** 节点队列 */
export interface NodeQueue {
  node: MarkdownNode
  isEntering: boolean
}

/** 遍历器的相关选项 */
export interface TraverserOptions {
  /**
   * 在节点进入时做些什么
   */
  onEnter?: (node: MarkdownNode, parent: MarkdownNode) => void

  /**
   * 在节点退出时做些什么
   */
  onLeave?: (node: MarkdownNode, parent: MarkdownNode) => void
}

export interface LintMdRuleWithOptions {
  /**
   * 规则函数
   */
  rule: LintMdRule

  /**
   * 相关选项
   */
  options?: Record<string, any>
}

export type LintMdRuleConfig =
  number
  | [number, Record<string, any>]
  | [LintMdRule, number, Record<string, any>];

/** 对外暴露的规则配置 */
export type LintMdRulesConfig = Record<string, LintMdRuleConfig>;

/** 规则级别 */
export enum RULE_SEVERITY {
  OFF = 0,
  WARN = 1,
  ERROR = 2
}

/** 注册的规则 */
export type RegisteredRules = Record<string, LintMdRuleWithOptions & { severity: number }>;

