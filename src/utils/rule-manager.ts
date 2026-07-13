import type {
  LintMdRuleContext,
  LintMdRuleWithOptions,
  ReportOption,
  ReportPosition
} from '../types';
import type { createRuleErrorCollector } from './rule-execution-errors';
import { createFixer } from './fixer';

/** 合法 offset 必须是有限非负整数：排除 NaN / Infinity / 负数，避免第三方规则传入非法值绕过兜底。 */
export const isValidOffset = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

/** 优先用节点真实 offset；缺失或非法时退回 (line, column) 兜底换算。 */
const resolveReportOffset = (
  position: ReportPosition,
  resolveOffset: (line: number, column: number) => number
): number =>
  isValidOffset(position.offset)
    ? position.offset
    : resolveOffset(position.line, position.column);

/**
 * 初始化全局 rule 管理器
 *
 * @param {string} appliedMarkdown 已经应用了规则的 markdown
 * @param collector 可选的规则执行错误收集器；传入后 getAllFixes 中 fix() 抛错会归入规则执行错误，
 *                 否则（如单测直接 new）fix 阶段错误仍按原生异常抛出。
 */
export const createRuleManager = (
  appliedMarkdown: string,
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

  // 暴露 collector 中已收集的规则执行错误（含 fix 阶段），供单测与上层聚合读取。
  const getExecutionErrors = () => collector?.getErrors() ?? [];

  const getAllFixes = () =>
    allReportedData.flatMap((item) => {
      if (typeof item.fix === 'function') {
        try {
          const fix = item.fix(fixer);
          return [{ ...fix, targetRule: item.name }];
        }
        catch (e) {
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
    ruleConfig: LintMdRuleWithOptions,
    extra: Pick<LintMdRuleContext, 'ast' | 'markdown'>
  ): LintMdRuleContext => {
    const { rule, options } = ruleConfig;
    const { ast, markdown } = extra;

    // 将 (line, column) 换算成文档中的真实偏移；供 offset 缺失时的兜底，避免切片退化成整篇文档。
    const resolveOffset = (line: number, column: number): number => {
      let offset = 0;
      let currentLine = 1;
      while (currentLine < line && offset < appliedMarkdown.length) {
        const next = appliedMarkdown.indexOf('\n', offset);
        if (next === -1) {
          break;
        }
        offset = next + 1;
        currentLine += 1;
      }
      return Math.min(appliedMarkdown.length, offset + Math.max(0, column - 1));
    };

    // 上报方法，供选择器内部调用
    const report = (option: Omit<ReportOption, 'content' | 'name'>) => {
      // 任一端 offset 缺失/非法即计一次兜底（按报告计数，不重复计起止两端）。
      const needsFallback
        = !isValidOffset(option.loc.start.offset) || !isValidOffset(option.loc.end.offset);
      if (needsFallback) {
        fallbackHits++;
      }

      const startOffset = resolveReportOffset(option.loc.start, resolveOffset);
      const endOffset = resolveReportOffset(option.loc.end, resolveOffset);
      const markStart = Math.max(0, startOffset - 5);
      const markEnd = Math.min(appliedMarkdown.length, endOffset + 5);

      allReportedData.push({
        ...option,
        content: appliedMarkdown.slice(markStart, markEnd),
        name: rule.meta.name
      });
    };

    return {
      report,
      options: options || {},
      ast,
      markdown
    };
  };

  return {
    getReportData,
    getExecutionErrors,
    getAllFixes,
    getFallbackHits,
    createRuleContext
  };
};
