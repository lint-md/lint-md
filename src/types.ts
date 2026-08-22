import type {
  ParsedPoint,
  PositionedMarkdownNode as ParserPositionedMarkdownNode,
  PositionedMarkdownRoot as ParserPositionedMarkdownRoot
} from '@lint-md/parser';
import type { createFixer } from './utils/fixer.js';

export type PositionedMarkdownNode = ParserPositionedMarkdownNode;
export type PositionedMarkdownRoot = ParserPositionedMarkdownRoot;

/** 节点单个位置点（line / column / offset 全部必填 number） */
export type MarkdownPosition = ParsedPoint;

/** 完整源码区间，语义为 [start.offset, end.offset)；offset 为权威坐标，line / column 由 offset 推导 */
export interface SourceRange {
  /** 起点位置（含） */
  start: MarkdownPosition
  /** 终点位置（offset 为排除端，即该 offset 处的字符不属于区间） */
  end: MarkdownPosition
}

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
export type TextRange = readonly [number, number];

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

/** Stable reason code for an unapplied fix. */
export enum FixNotAppliedReason {
  OVERLAP = 'overlap',
  SAME_OFFSET = 'same-offset'
}

/** A fix with its source rule ID. */
export interface RuleFixConfig extends FixConfig {
  targetRule: string
}

/**
 * A fix that the engine skipped because it conflicts with another fix.
 * `targetRule` and `reason` are JSON-compatible strings.
 * The inherited `data` field remains rule-defined and might not support JSON serialization.
 */
export interface NotAppliedFix extends RuleFixConfig {
  reason: FixNotAppliedReason
}

/** 上报信息配置 */
export interface ReportOption {
  name: string
  content: string
  message: string
  /**
   * 诊断位置。`offset` 字段对规则作者可选：
   * - 来自节点 `node.position`（如 `parseMd` 输出）的报告，offset 必填
   * - Rules can omit offset for synthetic positions. SourceCode resolves it.
   */
  loc: {
    start: ReportPosition
    end: ReportPosition
  }
  fix?: (fixer: ReturnType<typeof createFixer>) => FixConfig
}

/** 选择器调用 report() 时传入的参数：接受 loc 或 range，二者选一 */
export type RuleReportInput = Omit<ReportOption, 'content' | 'name' | 'loc'> & (
  | { loc: ReportOption['loc'] }
  | { range: TextRange }
);

/** Source code and mapping service for the current lint document */
export interface LintSourceCode {
  /** Complete original Markdown input */
  readonly text: string
  /** Parsed AST associated with this source document */
  readonly ast: PositionedMarkdownRoot
  /** Return the complete raw Markdown represented by a node */
  getRaw(node: PositionedMarkdownNode): string
  /**
   * Convert a range in normalized text-node value to an absolute
   * range in the original Markdown as `[start, end)`.
   */
  getTextRange(
    node: PositionedTextNode | PositionedInlineCodeNode,
    valueStart: number,
    valueEnd: number
  ): TextRange
  /**
   * Convert an absolute source offset to a position.
   * Throws RangeError if offset is not a finite integer in [0, text.length].
   */
  getPosition(offset: number): MarkdownPosition
  /**
   * Convert a source range to start/end positions.
   * Throws RangeError if range contains non-finite integers
   * or start < 0 or start > end or end > text.length.
   */
  getLocation(range: TextRange): {
    start: MarkdownPosition
    end: MarkdownPosition
  }
}

/** rules 上下文 */
export interface LintMdRuleContext {
  report: (option: RuleReportInput) => void
  options: Record<string, any>
  ast: PositionedMarkdownRoot
  markdown: string
  sourceCode: LintSourceCode
}

/** rule 选择器签名：执行器按 node.type 分发，selector 形参可以用 positioned 具体节点类型 */
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
/** @deprecated This legacy type remains for package root compatibility. */
export interface NodeQueue {
  node: PositionedMarkdownNode
  isEntering: boolean
}

/** 遍历器的相关选项 */
/** @deprecated Internal traversal now uses traverseMarkdown options. */
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
  /** 行号（1-indexed）。core 输出中与 range.start.line 同源 */
  line: number
  /** 列号（1-indexed）。core 输出中与 range.start.column 同源 */
  column: number
  /**
   * 完整源码区间（#190）：offset 为权威坐标，语义 [start.offset, end.offset)。
   * core 返回的诊断运行时恒有此字段；类型上可选是为让 2.x 手工构造
   * （如测试里组装 toALEOutput 入参）的代码在 minor 升级后仍可编译，
   * 下一个 major 将改为必填。
   */
  range?: SourceRange
  /** 规则名 */
  ruleId: string
  /** 诊断消息 */
  message: string
  /** 严重级别 */
  severity: RULE_SEVERITY
  /**
   * 该 report 是否声明了 automatic fix callback（#190）。
   * 只表示“存在 fix”，不表示 fix 已执行：lint-only 模式不运行 fix callback。
   * core 返回的诊断运行时恒有此字段；类型上可选的理由同 range，
   * 下一个 major 将改为必填。
   */
  fixable?: boolean
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
 * - `selector`：selector 节点回调阶段（执行器按 node.type 分发后执行）
 * - `fix`：fix() 回调阶段（单轮执行计算修复时执行）
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

/**
 * Options for `fixMarkdown`.
 *
 * @public
 */
export interface FixMarkdownOptions extends LintExecutionOptions {
  /** Rule settings for this fix operation. */
  rules?: LintMdRulesConfig
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
   * Fixes that still conflict when the fix loop stops.
   * Each range uses the input coordinates from that round.
   * A range is not guaranteed to apply directly to result.
   */
  notAppliedFixes: NotAppliedFix[]
  /** 收敛状态，调用方可据此判断质量而非盲用文本（兼容扩展，历史构造方式仍可用） */
  convergence?: FixConvergence
  /** 实际执行的 runLint 轮数（兼容扩展，历史构造方式仍可用） */
  rounds?: number
  /** 性能基线，可选；用于后续判断是否值得做增量重跑的独立研究 */
  metrics?: FixMetrics
}

/**
 * `lintMarkdown` 返回的 legacy 诊断项（带严重级别）。
 * @deprecated Prefer LintDiagnostic for new integrations.
 */
export interface LintReportItem {
  loc: ReportOption['loc']
  message: string
  name: string
  content: string
  severity: RULE_SEVERITY
}

/** `lintMarkdown` 返回结果的公共部分 */
/** 从 canonical diagnostics 派生的统计摘要（#190）；diagnostics 是唯一的 counts 来源 */
export interface LintSummary {
  /** severity === ERROR 的诊断数 */
  errorCount: number
  /** severity === WARN 的诊断数 */
  warningCount: number
  /** ERROR 且 fixable 的诊断数 */
  fixableErrorCount: number
  /** WARN 且 fixable 的诊断数 */
  fixableWarningCount: number
}

export interface LintMdResultBase {
  /**
   * @deprecated Use diagnostics instead.
   */
  lintResult: LintReportItem[]
  diagnostics: LintDiagnostic[]
  /** 由 diagnostics 派生的统计摘要；顶层 fixable counts 是它的兼容投影 */
  summary: LintSummary
  /**
   * @deprecated Use summary.fixableErrorCount.
   */
  fixableErrorCount: number
  /**
   * @deprecated Use summary.fixableWarningCount.
   */
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
