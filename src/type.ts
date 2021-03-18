import * as unist from 'unist';

export interface PlainObject<T = any> {
  [key: string]: T;
}

// ast 描述的文本位置
export interface ASTLocation {
  line: number
  column: number
}

// lintMd 的 fix module 定义
export type LintMdFixer = (markdown: string, error: LintMdError) => string

// lint error 的级别
export type Severity = 0 | 1 | 2;

// 支持的规则等级
export type RuleLevel = Severity | 'off' | 'warn' | 'error';

// 规则的自定义选项
export type RuleLevelAndOptions<Options extends PlainObject = (undefined | PlainObject)> = [RuleLevel, Options];

// lint-md 规则
export type LintMdRuleEntry = RuleLevel | RuleLevelAndOptions

// 用户传入的 lint 配置
export type LintMdRulesConfig = PlainObject<LintMdRuleEntry>

// lint-md 的描述 (Description) 选项
export interface LintMdDescriptionOptions {
  message: string
}

// lint-md lint 输出信息的描述
export type LintMdDescription = PlainObject<LintMdDescriptionOptions>

// plugin 的错误报告
export interface LintMdError {
  // 错误等级
  level: string
  // 错误类型
  type: string
  // 错误文本
  text: string
  // 错误位置 -- start
  start: ASTLocation
  end: ASTLocation
  // ast
  ast?: unist.Node
}

