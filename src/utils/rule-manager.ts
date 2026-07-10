import type { LintMdRuleContext, LintMdRuleWithOptions, ReportOption } from '../types';
import { createFixer } from './fixer';

/**
 * 初始化全局 rule 管理器
 *
 * @param {string} appliedMarkdown 已经应用了规则的 markdown
 */
export const createRuleManager = (appliedMarkdown: string) => {
  // 修复器
  const fixer = createFixer();

  // 已经上报的数据
  const allReportedData: ReportOption[] = [];

  // 获取所有上报的数据
  const getReportData = () => {
    return allReportedData;
  };

  // 获取所有的 fix
  const getAllFixes = () => {
    return allReportedData.flatMap((item) => {
      if (typeof item.fix === 'function') {
        const fix = item.fix(fixer);
        return [{ ...fix, targetRule: item.name }];
      }
      return [];
    });
  };

  // 初始化一个 rule context
  const createRuleContext = (
    ruleConfig: LintMdRuleWithOptions,
    extra: Pick<LintMdRuleContext, 'ast' | 'markdown'>
  ): LintMdRuleContext => {
    const { rule, options } = ruleConfig;
    const { ast, markdown } = extra;

    // 将 (line, column) 换算成文档中的真实偏移。
    // 用于 offset 缺失（规则侧合成 loc）时的兜底，避免切片退化成整篇文档。
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
      // 行内偏移：列从 1 开始
      return Math.min(appliedMarkdown.length, offset + Math.max(0, column - 1));
    };

    // 上报方法，供选择器内部调用
    const report = (option: Omit<ReportOption, 'content' | 'name'>) => {
      // offset 在 ReportOption 中是可选的（合成 loc 没有真实 offset），这里兜底
      const startOffset = option.loc.start.offset
        ?? resolveOffset(option.loc.start.line, option.loc.start.column);
      const endOffset = option.loc.end.offset
        ?? resolveOffset(option.loc.end.line, option.loc.end.column);
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
    getAllFixes,
    createRuleContext
  };
};
