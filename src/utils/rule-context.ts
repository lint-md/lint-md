import { isFunction } from 'lodash';
import { ReportOption } from '../types';
import { createFixer } from './fixer';

/**
 * 初始化 rule 上下文实例
 *
 * @date 2021-12-14 11:45:09
 */
export const createRuleContext = () => {
  // 修复器
  const fixer = createFixer();

  // 已经上报的数据
  const allReportedData: ReportOption[] = [];

  // 上报方法，供选择器内部调用
  const report = (option: ReportOption) => {
    allReportedData.push(option);
  };

  // 获取所有上报的数据
  const getReportData = () => {
    return allReportedData;
  };

  // 获取所有的 fix
  const getAllFixes = () => {
    return allReportedData
      .filter(item => isFunction(item.fix))
      .map(item => item.fix(fixer));
  };

  return {
    report: report,
    getReportData: getReportData,
    getAllFixes: getAllFixes
  };
};
