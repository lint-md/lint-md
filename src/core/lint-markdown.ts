import type {
  FixMarkdownOptions,
  FixMarkdownResult,
  FixedResult,
  LintDiagnostic,
  LintExecutionOptions,
  LintMarkdownOptions,
  LintMarkdownResult,
  LintMdFixResult,
  LintMdLintResult,
  LintMdResult,
  LintMdRuleWithOptions,
  LintMdRulesConfig,
  LintReportItem,
  LintSummary
} from '../types.js';
import * as internalRuleConfig from '../rules/index.js';
import { DEFAULT_RULE_SEVERITIES } from '../rules/default-rule-severities.js';
import { normalizeRuleRegistry } from '../utils/normalize-rule-registry.js';
import { summarizeDiagnostics } from '../utils/lint-summary.js';
import { RULE_SEVERITY } from '../types.js';
import { type ExecutionReport, runLint } from './run-lint.js';
import { handleFixMode } from './handle-fix-mode.js';

export const lintMarkdownInternal = (
  markdown: string,
  rules: LintMdRuleWithOptions[],
  isFixMode: boolean,
  policy: 'collect' | 'strict' = 'collect'
): {
  lintResult: ReturnType<typeof runLint>
  remainingLintResult: ReturnType<typeof runLint> | null
  fixedResult: FixedResult | null
  executionErrors: ReturnType<typeof runLint>['executionErrors']
} => {
  if (!isFixMode) {
    const lintResult = runLint(markdown, rules, { ruleErrorPolicy: policy });
    return {
      lintResult,
      remainingLintResult: null,
      fixedResult: null,
      executionErrors: lintResult.executionErrors
    };
  }
  else {
    const {
      lintResult,
      remainingLintResult,
      fixedResult,
      executionErrors
    } = handleFixMode(markdown, rules, policy);
    return {
      lintResult,
      remainingLintResult,
      fixedResult,
      executionErrors
    };
  }
};

const resolveConfiguredRules = (rules: LintMdRulesConfig) => {
  const registry = normalizeRuleRegistry(
    internalRuleConfig,
    rules,
    DEFAULT_RULE_SEVERITIES
  );

  return [...registry.values()]
    .filter(value => value.severity !== RULE_SEVERITY.OFF);
};

const buildDiagnostics = (
  reports: readonly ExecutionReport[]
): LintDiagnostic[] => reports.map(report => ({
  line: report.range.start.line,
  column: report.range.start.column,
  range: report.range,
  ruleId: report.name,
  message: report.message,
  severity: report.severity,
  fixable: typeof report.fix === 'function'
}));

const buildLintResult = (
  executionResult: ReturnType<typeof lintMarkdownInternal>
): LintMarkdownResult | FixMarkdownResult => {
  const {
    fixedResult,
    lintResult,
    remainingLintResult,
    executionErrors
  } = executionResult;
  const reports = lintResult.reports;
  const reportDataWithSeverity = new Array<LintReportItem>(reports.length);
  const diagnostics = new Array<LintDiagnostic>(reports.length);

  for (let index = 0; index < reports.length; index++) {
    const report = reports[index];
    const severity = report.severity as RULE_SEVERITY;
    reportDataWithSeverity[index] = {
      loc: report.loc,
      message: report.message,
      name: report.name,
      content: report.content,
      severity
    };
    diagnostics[index] = {
      line: report.range.start.line,
      column: report.range.start.column,
      range: report.range,
      ruleId: report.name,
      message: report.message,
      severity: report.severity,
      fixable: typeof report.fix === 'function'
    };
  }

  const summary = summarizeDiagnostics(diagnostics);

  const baseResult = {
    lintResult: reportDataWithSeverity,
    diagnostics,
    summary,
    fixableErrorCount: summary.fixableErrorCount,
    fixableWarningCount: summary.fixableWarningCount,
    executionErrors,
    complete: executionErrors.length === 0
  };

  if (fixedResult === null) {
    return { ...baseResult, fixedResult };
  }

  const finalLintResult = remainingLintResult!;
  const remainingDiagnostics = finalLintResult === lintResult
    ? diagnostics
    : buildDiagnostics(finalLintResult.reports);
  const remainingSummary: LintSummary = remainingDiagnostics === diagnostics
    ? summary
    : summarizeDiagnostics(remainingDiagnostics);

  return {
    ...baseResult,
    fixedResult,
    initialDiagnostics: diagnostics,
    remainingDiagnostics,
    initialSummary: summary,
    remainingSummary
  };
};

function executeMarkdown(markdown: string, rules: LintMdRulesConfig, isFixMode: true, options: LintExecutionOptions): FixMarkdownResult;
function executeMarkdown(markdown: string, rules: LintMdRulesConfig, isFixMode: false, options: LintExecutionOptions): LintMarkdownResult;
function executeMarkdown(markdown: string, rules: LintMdRulesConfig, isFixMode: boolean, options: LintExecutionOptions): LintMdResult;
function executeMarkdown(
  markdown: string,
  rules: LintMdRulesConfig,
  isFixMode: boolean,
  options: LintExecutionOptions
): LintMdResult {
  const executableRules = resolveConfiguredRules(rules);
  const policy = options.ruleErrorPolicy ?? 'collect';
  const executionResult = lintMarkdownInternal(
    markdown,
    executableRules,
    isFixMode,
    policy
  );

  return buildLintResult(executionResult);
}

const isLintMarkdownOptions = (
  value: LintMarkdownOptions | LintMdRulesConfig | undefined
): value is LintMarkdownOptions => {
  if (value === undefined) {
    return false;
  }

  const hasRuleErrorPolicy = 'ruleErrorPolicy' in value
    && (value.ruleErrorPolicy === 'collect' || value.ruleErrorPolicy === 'strict');

  const hasRules = 'rules' in value
    && typeof value.rules === 'object'
    && value.rules !== null
    && !Array.isArray(value.rules);

  return hasRuleErrorPolicy || hasRules;
};

/**
 * Lint Markdown without applying fixes.
 *
 * @public
 */
export function lintMarkdown(markdown: string, options: LintMarkdownOptions): LintMarkdownResult;
/** @deprecated Use `fixMarkdown(markdown, options)` for automatic fixes. */
export function lintMarkdown(markdown: string): LintMdFixResult;
/** @deprecated Use the options-based overload for lint-only checks. */
export function lintMarkdown(markdown: string, rules: LintMdRulesConfig): LintMdFixResult;
/** @deprecated Use `fixMarkdown(markdown, options)`. */
export function lintMarkdown(markdown: string, rules: LintMdRulesConfig | undefined, isFixMode: true, options?: LintExecutionOptions): LintMdFixResult;
/** @deprecated Use the options-based overload for lint-only checks. */
export function lintMarkdown(markdown: string, rules: LintMdRulesConfig | undefined, isFixMode: false, options?: LintExecutionOptions): LintMdLintResult;
/** @deprecated Use `lintMarkdown(markdown, options)` or `fixMarkdown(markdown, options)`. */
export function lintMarkdown(markdown: string, rules: LintMdRulesConfig | undefined, isFixMode: boolean, options?: LintExecutionOptions): LintMdResult;
export function lintMarkdown(
  markdown: string,
  rulesOrOptions: LintMdRulesConfig | LintMarkdownOptions = {},
  isFixMode?: boolean,
  options: LintExecutionOptions = {}
): LintMdResult {
  if (arguments.length === 2 && isLintMarkdownOptions(rulesOrOptions)) {
    return executeMarkdown(markdown, rulesOrOptions.rules ?? {}, false, rulesOrOptions);
  }

  return executeMarkdown(
    markdown,
    rulesOrOptions as LintMdRulesConfig,
    isFixMode ?? true,
    options
  );
}

/**
 * Apply configured fixes to Markdown.
 *
 * `diagnostics` and `initialDiagnostics` describe the original input.
 * `remainingDiagnostics` describes `fixedResult.result`.
 *
 * @public
 */
export function fixMarkdown(
  markdown: string,
  options: FixMarkdownOptions = {}
): FixMarkdownResult {
  return executeMarkdown(markdown, options.rules ?? {}, true, options);
}
