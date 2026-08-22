import type {
  FixMarkdownOptions,
  FixedResult,
  LintExecutionOptions,
  LintMdFixResult,
  LintMdLintResult,
  LintMdResult,
  LintMdRuleWithOptions,
  LintMdRulesConfig,
  LintReportItem
} from '../types.js';
import * as internalRuleConfig from '../rules/index.js';
import { DEFAULT_RULE_SEVERITIES } from '../rules/default-rule-severities.js';
import { normalizeRuleRegistry } from '../utils/normalize-rule-registry.js';
import { RULE_SEVERITY } from '../types.js';
import { runLint } from './run-lint.js';
import { handleFixMode } from './handle-fix-mode.js';

export const lintMarkdownInternal = (
  markdown: string,
  rules: LintMdRuleWithOptions[],
  isFixMode: boolean,
  policy: 'collect' | 'strict' = 'collect'
): {
  lintResult: ReturnType<typeof runLint>
  fixedResult: FixedResult | null
  executionErrors: ReturnType<typeof runLint>['executionErrors']
} => {
  if (!isFixMode) {
    const lintResult = runLint(markdown, rules, { ruleErrorPolicy: policy });
    return {
      lintResult,
      fixedResult: null,
      executionErrors: lintResult.executionErrors
    };
  }
  else {
    const { lintResult, fixedResult, executionErrors } = handleFixMode(markdown, rules, policy);
    return {
      lintResult,
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

const buildLintResult = (
  executionResult: ReturnType<typeof lintMarkdownInternal>
): LintMdResult => {
  const { fixedResult, lintResult, executionErrors } = executionResult;
  const reportData = lintResult.reports;
  let fixableErrorCount = 0;
  let fixableWarningCount = 0;

  const reportDataWithSeverity: LintReportItem[] = reportData.map((item) => {
    const severity = item.severity as RULE_SEVERITY;

    if (typeof item.fix === 'function') {
      if (severity === RULE_SEVERITY.ERROR) {
        fixableErrorCount++;
      }
      else if (severity === RULE_SEVERITY.WARN) {
        fixableWarningCount++;
      }
    }

    const { loc, message, name, content } = item;
    return {
      loc,
      message,
      name,
      content,
      severity
    };
  });

  // line/column 从规范 range 取值而非透传 item.loc：
  // 规则可能上报与 offset 矛盾的 loc，range 才是与 content / fix 同一坐标系的权威。
  const diagnostics = reportData.map(item => ({
    line: item.range.start.line,
    column: item.range.start.column,
    range: item.range,
    ruleId: item.name,
    message: item.message,
    severity: item.severity,
    // 只反映“声明了 fix callback”；lint-only 不执行 fix（computeFixes 才会），
    // 因此这里绝不能调用 item.fix 来探测可修复性。
    fixable: typeof item.fix === 'function'
  }));

  return {
    lintResult: reportDataWithSeverity,
    diagnostics,
    fixedResult,
    fixableErrorCount,
    fixableWarningCount,
    executionErrors
  };
};

function executeMarkdown(markdown: string, rules: LintMdRulesConfig, isFixMode: true, options: LintExecutionOptions): LintMdFixResult;
function executeMarkdown(markdown: string, rules: LintMdRulesConfig, isFixMode: false, options: LintExecutionOptions): LintMdLintResult;
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

/**
 * 核心方法，对某个 Markdown 文本进行 lint 或者 fix
 *
 * @date 2021-12-14 17:16:12
 *    默认开启 fix 模式：
 * - isFixMode=true 或省略时，fixedResult 为 FixedResult
 * - isFixMode=false 时，fixedResult 为 null
 * - isFixMode 为 boolean 变量时，返回联合类型
 */
export function lintMarkdown(markdown: string, rules?: LintMdRulesConfig, isFixMode?: true, options?: LintExecutionOptions): LintMdFixResult;
export function lintMarkdown(markdown: string, rules?: LintMdRulesConfig, isFixMode?: false, options?: LintExecutionOptions): LintMdLintResult;
export function lintMarkdown(markdown: string, rules?: LintMdRulesConfig, isFixMode?: boolean, options?: LintExecutionOptions): LintMdResult;
export function lintMarkdown(markdown: string, rules: LintMdRulesConfig = {}, isFixMode = true, options: LintExecutionOptions = {}): LintMdResult {
  return executeMarkdown(markdown, rules, isFixMode, options);
}

/**
 * Apply configured fixes to Markdown.
 *
 * `lintResult` describes the original input. `fixedResult.result` contains
 * the final fixed Markdown.
 *
 * @public
 */
export function fixMarkdown(
  markdown: string,
  options: FixMarkdownOptions = {}
): LintMdFixResult {
  return executeMarkdown(markdown, options.rules ?? {}, true, options);
}
