export interface PlainObject<T = any> {
  [key: string]: T;
}

export interface ASTLocation {
  line: number
  column: number
}

export type LintMdFixPlugin = (markdown: string, error: any) => string

export type LintMdRules = PlainObject<LintMdFixPlugin>

// lint error 的级别
export type Severity = 0 | 1 | 2;

export type RuleLevel = Severity | 'off' | 'warn' | 'error';


export type RuleLevelAndOptions<Options extends PlainObject = (undefined | PlainObject)> = [RuleLevel, Options];

export type LintMdRuleEntry = RuleLevel | RuleLevelAndOptions

// 用户传入的 lint 配置
export type LintMdRulesConfig = PlainObject<LintMdRuleEntry>

export interface LintMdDescriptionOptions {
  message: string
}

export type LintMdDescription = PlainObject<LintMdDescriptionOptions>

// TODO: define it!
export type PluginError = any

