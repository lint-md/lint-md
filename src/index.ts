export { fixMarkdown, lintMarkdown } from './core/lint-markdown.js';
export {
  correctTitleTrailingPunctuation,
  noEmptyBlockquote,
  noEmptyCode,
  noEmptyCodeLang,
  noEmptyInlineCode,
  noEmptyList,
  noEmptyURL,
  noFullWidthNumber,
  noHalfWidthPunctuation,
  noLongCode,
  noMultipleBlankLines,
  noMultipleSpaceBlockquote,
  noSpaceInInlineCode,
  noSpaceInLink,
  noSpecialCharacters,
  requireTrailingSpaces,
  spaceAroundAlphabet,
  spaceAroundLink,
  spaceAroundNumber,
  useStandardEllipsis
} from './rules/index.js';
export {
  FixConvergence,
  FixNotAppliedReason,
  RULE_SEVERITY
} from './types.js';
export type {
  FixConfig,
  FixedResult,
  FixMarkdownOptions,
  FixMarkdownResult,
  FixMetrics,
  LintDiagnostic,
  LintExecutionOptions,
  LintMarkdownOptions,
  LintMarkdownResult,
  LintMdFixResult,
  LintMdLintResult,
  LintMdResult,
  LintMdResultBase,
  LintMdRule,
  LintMdRuleConfig,
  LintMdRuleContext,
  LintMdRulesConfig,
  LintMdRuleWithOptions,
  LintReportItem,
  LintSourceCode,
  LintSummary,
  MarkdownPosition,
  NodeQueue,
  NotAppliedFix,
  PositionedBlockquoteNode,
  PositionedCodeNode,
  PositionedImageNode,
  PositionedInlineCodeNode,
  PositionedLinkNode,
  PositionedListItemNode,
  PositionedMarkdownNode,
  PositionedMarkdownRoot,
  PositionedTextNode,
  RegisteredRules,
  ReportOption,
  ReportPosition,
  RuleErrorPolicy,
  RuleExecutionError,
  RuleExecutionPhase,
  RuleFixConfig,
  RuleReportInput,
  RuleSelector,
  RunLintOptions,
  SourceRange,
  TextRange,
  TraverserOptions
} from './types.js';
export { toALEOutput } from './diagnostics.js';
// strict 模式下规则执行失败抛出的专用异常类，供调用方做 `instanceof` 判断。
export { RuleExecutionFailure } from './utils/rule-execution-errors.js';
export { InvalidRuleRangeError } from './utils/source-code-errors.js';
export {
  SourceMapConsistencyError,
  SourceMapError,
  SourceMapUnavailableError
} from '@lint-md/parser';
