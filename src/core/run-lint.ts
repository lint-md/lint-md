import { parseMdWithSourceMap } from '@lint-md/parser';
import type {
  LintMdRuleWithOptions,
  ReportOption,
  RuleExecutionError,
  RuleFixConfig,
  RuleSelector,
  RunLintOptions
} from '../types.js';
import { RULE_SEVERITY } from '../types.js';
import { traverseMarkdown } from '../utils/traverser.js';
import { createRuleManager } from '../utils/rule-manager.js';
import { createRuleErrorCollector } from '../utils/rule-execution-errors.js';
import { createLintSourceCode } from '../utils/source-code.js';
import { isSourceMapError } from '../utils/source-code-errors.js';

interface RunLintRoundOptions extends RunLintOptions {
  /** Run reported fix callbacks before this function returns. */
  computeFixes?: boolean
}

interface RuleExecutionConfig extends LintMdRuleWithOptions {
  readonly id?: string
  readonly severity?: number
}

interface RegisteredSelector {
  readonly ruleName: string
  readonly selector: RuleSelector
}

export interface RunLintReport extends ReportOption {
  severity: number
}

export interface RunLintResult {
  reports: RunLintReport[]
  fixes: RuleFixConfig[]
  executionErrors: RuleExecutionError[]
  fallbackHits: number
}

/**
 * 基于各种 rules 对 Markdown 文本进行校验
 *
 * 规则执行错误策略（见 issue #179）：
 * - 默认兼容模式（collect）：任一 selector 抛错时，仅记录该规则该节点的失败，
 *   不打断同节点其它规则，也不打断后续节点遍历；不写 console.error，错误以
 *   结构化 executionErrors 数组随结果返回。
 * - 严格模式（strict）：首次规则执行失败立即抛 RuleExecutionFailure。
 * 错误按 selector 逐条捕获，而非包住同一节点的完整分发，
 * 这样才能满足“多个规则失败、部分成功”的验收。
 *
 * @date 2021-12-12 21:48:21
 */
export const runLint = (
  markdown: string,
  allRuleConfigs: RuleExecutionConfig[],
  options: RunLintRoundOptions = {}
): RunLintResult => {
  const policy = options.ruleErrorPolicy ?? 'collect';
  const round = options.round ?? 0;

  // The collector must exist before fix callbacks run.
  const collector = createRuleErrorCollector(policy, round);

  // Parser owns normalized-text -> original-Markdown mapping.
  // Expose it to rules through the per-document SourceCode service.
  const { ast, sourceMap } = parseMdWithSourceMap(markdown);

  const sourceCode = createLintSourceCode({ text: markdown, ast, sourceMap });

  const severityById = new Map(
    allRuleConfigs.map(({ id, rule, severity }) => [
      id ?? rule.meta.name,
      severity ?? RULE_SEVERITY.ERROR
    ])
  );

  // The manager holds mutable state only during this execution round.
  const ruleManager = createRuleManager(sourceCode, collector);

  const selectorsByType = new Map<string, RegisteredSelector[]>();

  // Selector order follows rule configuration order for each node type.
  for (const { rule, options: ruleOptions } of allRuleConfigs) {
    const ruleContext = ruleManager.createRuleContext({ rule, options: ruleOptions });

    // create 阶段也可能抛错，需在调用 create 处捕获并归入规则执行错误。
    let ruleSelectors: Record<string, RuleSelector>;
    try {
      ruleSelectors = rule.create(ruleContext);
    }
    catch (e) {
      // Source-map errors are infrastructure failures.
      if (isSourceMapError(e)) {
        throw e;
      }
      collector.collect(rule.meta.name, 'create', e);
      continue;
    }

    for (const nodeType of Object.keys(ruleSelectors)) {
      const registeredSelector: RegisteredSelector = {
        ruleName: rule.meta.name,
        selector: ruleSelectors[nodeType]
      };
      const registered = selectorsByType.get(nodeType);
      if (registered) {
        registered.push(registeredSelector);
      }
      else {
        selectorsByType.set(nodeType, [registeredSelector]);
      }
    }
  }

  traverseMarkdown(ast, {
    enter: (node) => {
      const registered = selectorsByType.get(node.type);
      if (!registered) {
        return;
      }
      for (const { ruleName, selector } of registered) {
        try {
          selector(node);
        }
        catch (error) {
          // Source-map errors are infrastructure failures.
          if (isSourceMapError(error)) {
            throw error;
          }
          // 严格模式会在 collect 内抛出 RuleExecutionFailure，向上传递。
          collector.collect(ruleName, 'selector', error, node.type);
        }
      }
    }
  });

  const fixes = options.computeFixes
    ? ruleManager.getAllFixes()
    : [];

  return {
    reports: ruleManager.getReportData().map(report => ({
      ...report,
      severity: severityById.get(report.name) ?? RULE_SEVERITY.ERROR
    })),
    fixes,
    executionErrors: collector.getErrors(),
    fallbackHits: ruleManager.getFallbackHits()
  };
};
