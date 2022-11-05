import { isFunction } from 'lodash';
import type { LintMdRuleWithOptions, ReportOption } from '../types';
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
    return allReportedData
      .filter((item) => {
        return isFunction(item.fix);
      })
      .map((item) => {
        // @ts-expect-error
        const fix = item.fix(fixer);
        return {
          ...fix,
          targetRule: item.name
        };
      });
  };

  // 初始化一个 rule context
  const createRuleContext = (ruleConfig: LintMdRuleWithOptions, data?: any) => {
    const { rule, options } = ruleConfig;

    // 上报方法，供选择器内部调用
    const report = (option: Omit<ReportOption, 'content' | 'name'>) => {
      // TODO: 修复底层库的类型定义
      const location = option.loc as any;

      const markStart = Math.max(0, location.start.offset - 5);
      const markEnd = Math.min(appliedMarkdown.length, location.end.offset + 5);

      allReportedData.push({
        ...option,
        content: appliedMarkdown.slice(markStart, markEnd),
        name: rule.meta.name
      });
    };

    return {
      report,
      options: options || {},
      ...data
    };
  };

  return {
    getReportData,
    getAllFixes,
    createRuleContext
  };
};
