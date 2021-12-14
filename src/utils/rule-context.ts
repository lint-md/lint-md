import { ReportOption, RuleContext } from '../types';

/**
 * 初始化 rule 上下文实例
 *
 * @date 2021-12-14 11:45:09
 */
export const createRuleContext = (): RuleContext => {
  const reportData: ReportOption[] = [];

  const report = (option: ReportOption) => {
    reportData.push(option);
  };

  const getReportData = () => {
    return reportData;
  };
  return {
    report: report,
    getReportData: getReportData
  };
};
