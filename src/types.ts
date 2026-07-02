import type {
  ParsedPoint,
  PositionedMarkdownNode as ParserPositionedMarkdownNode,
  PositionedMarkdownRoot as ParserPositionedMarkdownRoot
} from '@lint-md/parser';
import type { createFixer } from './utils/fixer';

export type PositionedMarkdownNode = ParserPositionedMarkdownNode;
export type PositionedMarkdownRoot = ParserPositionedMarkdownRoot;

/** 节点单个位置点（line / column / offset 全部必填 number） */
export type MarkdownPosition = ParsedPoint;

/** 上报位置点（line / column 必填，offset 可选） */
export interface ReportPosition {
  line: number
  column: number
  offset?: number
}

/**
 * 各种具体节点类型的 positioned 版本。
 *
 * 用 `Extract` 从 positioned 联合里按 `type` 字面量精确提取，比用 `Positioned<Code>`
 * 等直接包装更准确：例如 `inlineCode` 不是 `Code`，`image` 没有 `children`，
 * 不能复用 `Code` / `Link` 的 positioned 包装。
 */
export type PositionedCodeNode = Extract<PositionedMarkdownNode, { type: 'code' }>;
export type PositionedInlineCodeNode = Extract<PositionedMarkdownNode, { type: 'inlineCode' }>;
export type PositionedLinkNode = Extract<PositionedMarkdownNode, { type: 'link' }>;
export type PositionedImageNode = Extract<PositionedMarkdownNode, { type: 'image' }>;
export type PositionedListItemNode = Extract<PositionedMarkdownNode, { type: 'listItem' }>;
export type PositionedTextNode = Extract<PositionedMarkdownNode, { type: 'text' }>;
export type PositionedBlockquoteNode = Extract<PositionedMarkdownNode, { type: 'blockquote' }>;

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
  /**
   * 诊断位置。`offset` 字段对规则作者可选：
   * - 来自节点 `node.position`（如 `parseMd` 输出）的报告，offset 必填
   * - 规则侧合成的位置（如多行超长代码的某一行）可省略，由 rule-manager 兜底
   */
  loc: {
    start: ReportPosition
    end: ReportPosition
  }
  fix?: (fixer: ReturnType<typeof createFixer>) => FixConfig
}

/** rules 上下文 */
export interface LintMdRuleContext {
  report: (option: Omit<ReportOption, 'content' | 'name'>) => void
  options: Record<string, any>
  ast: PositionedMarkdownRoot
  markdown: string
}

/** rule 选择器签名：emitter 已按 node.type 分发，selector 形参可以用 positioned 具体节点类型 */
export type RuleSelector = (node: PositionedMarkdownNode) => void;

/** rule */
export interface LintMdRule {
  /**
   * 选择器初始化回调
   */
  create: (context: LintMdRuleContext) => Record<string, RuleSelector>

  /**
   * rule 的一些基本信息，后续有需要再补充
   */
  meta: {
    name: string
  }
}

/** 节点队列 */
export interface NodeQueue {
  node: PositionedMarkdownNode
  isEntering: boolean
}

/** 遍历器的相关选项 */
export interface TraverserOptions {
  /**
   * 在节点进入时做些什么
   */
  onEnter?: (node: PositionedMarkdownNode, parent: PositionedMarkdownNode | null) => void

  /**
   * 在节点退出时做些什么
   */
  onLeave?: (node: PositionedMarkdownNode, parent: PositionedMarkdownNode | null) => void
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
