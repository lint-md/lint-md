import type { MarkdownNode } from '@lint-md/parser';
import type { createFixer } from './utils/fixer';

/** 节点位置 */
export interface MarkdownPosition {
  line: number
  column: number
  offset?: number
}

/** 带 offset 的节点位置（用于 fix 操作） */
export interface MarkdownOffsetPosition extends MarkdownPosition {
  offset: number
}

/** 位置范围 */
export interface MarkdownLocation {
  start: MarkdownPosition
  end: MarkdownPosition
}

/** 带 offset 的位置范围（用于 fix 操作） */
export interface MarkdownOffsetLocation extends MarkdownLocation {
  start: MarkdownOffsetPosition
  end: MarkdownOffsetPosition
}

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
  data?: Record<string, unknown>
}

/** 上报信息配置 */
export interface ReportOption {
  name: string
  content: string
  message: string
  loc: MarkdownLocation
  fix?: (fixer: ReturnType<typeof createFixer>) => FixConfig
}

/** rules 上下文 */
export interface LintMdRuleContext {
  report: (option: Omit<ReportOption, 'content' | 'name'>) => void
  options: Record<string, any>
  ast: MarkdownNode
  markdown: string
}

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
  onEnter?: (node: MarkdownNode, parent: MarkdownNode | null) => void

  /**
   * 在节点退出时做些什么
   */
  onLeave?: (node: MarkdownNode, parent: MarkdownNode | null) => void
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

/** 标准诊断格式，供各集成平台消费 */
export interface LintDiagnostic {
  /** 行号（1-indexed） */
  line: number
  /** 列号（1-indexed） */
  column: number
  /** 规则名 */
  ruleId: string
  /** 诊断消息 */
  message: string
  /** 严重级别 */
  severity: RULE_SEVERITY
}

