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

    // 上报方法，供选择器内部调用
    const report = (option: Omit<ReportOption, 'content' | 'name'>) => {
      const startOffset = option.loc.start.offset ?? 0;
      const endOffset = option.loc.end.offset ?? appliedMarkdown.length;
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
