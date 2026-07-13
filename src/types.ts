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

/** fix 收敛状态：调用方据此区分“已稳定”“检测到循环”“达到上限” */
export enum FixConvergence {
  /** 无 fix 可应用或文本不再变化，正常收敛 */
  STABLE = 'stable',
  /** 检测到振荡循环（某轮 current 文本曾出现过），提前停止 */
  CYCLE_DETECTED = 'cycle',
  /** 达到 MAX_LINT_AND_FIX_CALL_TIMES 上限被截断 */
  MAX_ROUNDS = 'max'
}

/** fix 收敛过程的性能基线（仅记录轮数 / 每轮 wall time，不拆分 parse/规则） */
export interface FixMetrics {
  /** 实际 runLint 次数 */
  rounds: number
  /** 整体 wall time（毫秒） */
  wallTime: number
  /** 每一轮的 wall time（毫秒） */
  perRound: number[]
}

/**
 * 规则执行错误的捕获阶段。
 * - `create`：rule.create() 初始化回调阶段（每条规则在遍历前执行一次）
 * - `selector`：selector 节点回调阶段（emitter 按 node.type 分发后执行）
 * - `fix`：fix() 回调阶段（applyFix 前 getAllFixes 调用时执行）
 * 仅覆盖规则自身执行路径，不覆盖 parser / 遍历器等基础设施故障。
 */
export type RuleExecutionPhase = 'create' | 'selector' | 'fix';

/** 规则执行错误收集策略（执行器级，非单规则级） */
export type RuleErrorPolicy = 'collect' | 'strict';

/** 全局执行选项，作为 lintMarkdown 的独立第 4 参数，不污染 LintMdRuleWithOptions */
export interface LintExecutionOptions {
  /** 规则执行失败策略；默认 'collect'，保持 CLI/编辑器获得部分结果的兼容行为 */
  ruleErrorPolicy?: RuleErrorPolicy
}

/** 单条规则执行错误，挂在 LintMdResultBase 上，对 lint-only 与 fix 多轮均适用 */
export interface RuleExecutionError {
  /** 失败规则名（来自 rule.meta.name） */
  ruleName: string
  /** 触发节点类型；create/fix 阶段无具体节点时为 undefined */
  nodeType?: string
  /** 规范化后的消息：Error 取 message，非 Error 抛值用 String() 归一化 */
  message: string
  /** 所属 fix 轮次（lint-only 恒为 0） */
  round: number
  /** 捕获阶段；用于区分 create / selector / fix 三类规则执行失败（collector 创建时必填） */
  phase: RuleExecutionPhase
}

/** runLint 的可选参数 */
export interface RunLintOptions {
  ruleErrorPolicy?: RuleErrorPolicy
  /** 本轮在 fix 模式下的轮次，用于聚合多轮错误；lint-only 恒为 0 */
  round?: number
}

/** fix 模式下 `fixedResult` 的形状 */
export interface FixedResult {
  /** 修复后的完整 Markdown 文本 */
  result: string
  /**
   * 最终轮次中因冲突等原因未能应用的修复项。
   * range 基于 result 文本的坐标，可直接用于 result。
   */
  notAppliedFixes: FixConfig[]
  /** 收敛状态，调用方可据此判断质量而非盲用文本（兼容扩展，历史构造方式仍可用） */
  convergence?: FixConvergence
  /** 实际执行的 runLint 轮数（兼容扩展，历史构造方式仍可用） */
  rounds?: number
  /** 性能基线，可选；用于后续判断是否值得做增量重跑的独立研究 */
  metrics?: FixMetrics
}

/** `lintMarkdown` 返回的 lint 诊断项（带严重级别） */
export interface LintReportItem {
  loc: ReportOption['loc']
  message: string
  name: string
  content: string
  severity: RULE_SEVERITY
}

/** `lintMarkdown` 返回结果的公共部分 */
export interface LintMdResultBase {
  lintResult: LintReportItem[]
  diagnostics: LintDiagnostic[]
  fixableErrorCount: number
  fixableWarningCount: number
  /**
   * 结构化根级规则执行错误数组（兼容所有返回模式：lint-only 与 fix 多轮）。
   * 兼容模式（默认）：继续执行，不写 console.error，最终在此返回。
   * 严格模式：首次规则执行失败立即抛出 RuleExecutionFailure，不返回正常结果。
   */
  executionErrors: RuleExecutionError[]
}

/** 非修复模式（isFixMode=false）：`fixedResult` 为 null */
export interface LintMdLintResult extends LintMdResultBase {
  fixedResult: null
}

/** 修复模式（isFixMode=true，默认）：`fixedResult` 为对象 */
export interface LintMdFixResult extends LintMdResultBase {
  fixedResult: FixedResult
}

/** `lintMarkdown` 的返回类型（按 isFixMode 区分 fixedResult 形状） */
export type LintMdResult = LintMdLintResult | LintMdFixResult;
