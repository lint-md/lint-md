export { lintMarkdown } from './core/lint-markdown';
export * from './rules';
export * from './types';
export { toALEOutput } from './diagnostics';
// strict 模式下规则执行失败抛出的专用异常类，供调用方做 `instanceof` 判断。
export { RuleExecutionFailure } from './utils/rule-execution-errors';
