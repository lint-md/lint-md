export interface LooseObject<T = any> {
  [key: string]: T;
}

export interface ASTLocation {
  line: number
  column: number
}

export type LintMdFixPlugin = (markdown: string, error: any) => string

export type LintMdRules = LooseObject<LintMdFixPlugin>

// lint error 的级别
type Severity = 0 | 1 | 2;

type RuleLevel = Severity | 'off' | 'warn' | 'error';


export type RuleLevelAndOptions<Options extends LooseObject = (undefined | LooseObject)> = [RuleLevel, Options];

export type LintMdRuleEntry = RuleLevel | RuleLevelAndOptions

// 用户传入的 lint 配置
export type LintMdRulesConfig = LooseObject<LintMdRuleEntry>

export interface LintMdDescriptionOptions {
  message: string
}

export type LintMdDescription = LooseObject<LintMdDescriptionOptions>

