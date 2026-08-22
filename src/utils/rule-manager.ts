import type {
  LintMdRuleContext,
  LintMdRuleWithOptions,
  ReportOption,
  RuleFixConfig,
  RuleReportInput,
  SourceRange
} from '../types.js';
import type { ReportSourceCode } from './source-code.js';
import type { createRuleErrorCollector } from './rule-execution-errors.js';
import { createFixer } from './fixer.js';
import { isSourceMapError } from './source-code-errors.js';

/** 内部存储的报告：loc 保留规则原始上报值，range 是从解析后 offset 推导的规范坐标 */
type StoredReport = ReportOption & { range: SourceRange };

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
  const allReportedData: StoredReport[] = [];

  // 统计触发兜底的报告数，使防御性 fallback 可观测、可收窄：
  // 计数单位是一条报告，其 start 或 end 任一 offset 缺失/非法计 1（同一报告不重复计）。
  let fallbackHits = 0;

  const getFallbackHits = () => fallbackHits;

  const getReportData = (): StoredReport[] => allReportedData;

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

      // 规范坐标从解析后的 offset 推导（#190）：offset 是唯一权威，
      // 避免 line/column 与 content、fix 使用的区间互相矛盾。
      // range 已归一化到 [0, text.length]。规则上报非数字坐标时 getPosition
      // 抛 InvalidRuleRangeError，按 selector 失败进入 collector，与既有策略一致。
      // 覆盖 spread 进来的 loc 输入形态可能携带的 range 元组，防止内部结构外泄。
      const resolvedRange: SourceRange = {
        start: sourceCode.getPosition(range[0]),
        end: sourceCode.getPosition(range[1])
      };

      allReportedData.push({
        ...option,
        loc,
        range: resolvedRange,
        content: sourceCode.getContext(range),
        name: rule.meta.name
      } as StoredReport);
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
