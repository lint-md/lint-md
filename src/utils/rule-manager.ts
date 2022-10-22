import { isFunction } from 'lodash';
import { LintMdRuleConfig, LintMdRuleInternalConfig, ReportOption } from '../types';
import { createFixer } from './fixer';

/**
 * 初始化全局 rule 管理器
 *
 * @date 2021-12-24 22:57:11
 */
export const createRuleManager = () => {
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
      .filter(item => isFunction(item.fix))
      .map(item => {
        const res = item.fix(fixer);
        return res;
      });
  };

  // 初始化一个 rule context
  const createRuleContext = (ruleConfig: LintMdRuleInternalConfig) => {
    const { rule, options } = ruleConfig;

    // 上报方法，供选择器内部调用
    const report = (option: Omit<ReportOption, 'name'>) => {
      allReportedData.push({
        ...option,
        name: rule.meta.name
      });
    };

    return {
      report: report,
      options: options || {}
    };
  };

  return {
    getReportData: getReportData,
    getAllFixes: getAllFixes,
    createRuleContext: createRuleContext
  };
};
