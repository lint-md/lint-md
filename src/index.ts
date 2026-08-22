export { fixMarkdown, lintMarkdown } from './core/lint-markdown.js';
export * from './rules/index.js';
export * from './types.js';
export { toALEOutput } from './diagnostics.js';
// strict 模式下规则执行失败抛出的专用异常类，供调用方做 `instanceof` 判断。
export { RuleExecutionFailure } from './utils/rule-execution-errors.js';
export { InvalidRuleRangeError } from './utils/source-code-errors.js';
export {
  SourceMapConsistencyError,
  SourceMapError,
  SourceMapUnavailableError
} from '@lint-md/parser';
