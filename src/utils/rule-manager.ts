import type {
  LintMdRuleContext,
  LintMdRuleWithOptions,
  ReportOption,
  RuleFixConfig,
  RuleReportInput
} from '../types';
import type { ReportSourceCode } from './source-code';
import type { createRuleErrorCollector } from './rule-execution-errors';
import { createFixer } from './fixer';
import { isSourceMapError } from './source-code-errors';

/**
 * 初始化全局 rule 管理器
 *
 * @param sourceCode The current document source and position Module.
 * @param collector The optional collector receives fix callback errors.
 */
export const createRuleManager = (
  sourceCode: ReportSourceCode,
  collector?: ReturnType<typeof createRuleErrorCollector>
) => {
  // 修复器
  const fixer = createFixer();

  // 已经上报的数据
  const allReportedData: ReportOption[] = [];

  // 统计触发兜底的报告数，使防御性 fallback 可观测、可收窄：
  // 计数单位是一条报告，其 start 或 end 任一 offset 缺失/非法计 1（同一报告不重复计）。
  let fallbackHits = 0;

  const getFallbackHits = () => fallbackHits;

  const getReportData = () => allReportedData;

  const getAllFixes = (): RuleFixConfig[] =>
    allReportedData.flatMap((item) => {
      if (typeof item.fix === 'function') {
        try {
          const fix = item.fix(fixer);
          return [{ ...fix, targetRule: item.name }];
        }
        catch (e) {
          // Source-map errors are infrastructure failures.
          if (isSourceMapError(e)) {
            throw e;
          }
          if (collector) {
            // 严格模式会在 collect 内抛 RuleExecutionFailure，向上传递。
            collector.collect(item.name, 'fix', e);
            return [];
          }
          throw e;
        }
      }
      return [];
    });

  // 初始化一个 rule context
  const createRuleContext = (
    ruleConfig: LintMdRuleWithOptions
  ): LintMdRuleContext => {
    const { rule, options } = ruleConfig;

    // 上报方法，供选择器内部调用
    const report = (option: RuleReportInput) => {
      const { loc, range, usedFallback }
        = sourceCode.normalizeReportLocation(option);
      if (usedFallback) {
        fallbackHits++;
      }

      allReportedData.push({
        ...option,
        loc,
        content: sourceCode.getContext(range),
        name: rule.meta.name
      } as ReportOption);
    };

    return {
      report,
      options: options || {},
      ast: sourceCode.ast,
      markdown: sourceCode.text,
      sourceCode
    };
  };

  return {
    getReportData,
    getAllFixes,
    getFallbackHits,
    createRuleContext
  };
};
