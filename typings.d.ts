// ast-plugin

declare module 'ast-plugin' {
  import * as Unist from 'unist';
  import { Linter } from 'eslint';
  import RuleLevel = Linter.RuleLevel;

  interface LooseObject {
    [key: string]: any;
  }

  interface CfgOptions {
    throwError: (error) => void;
    config: unknown;
  }

  // 用户的 rule 配置
  export interface PluginRuleConfig {
    level: RuleLevel
    config?: LooseObject
  }

  export interface PluginError {
    level: number
    type: string
    ast?: Ast
  }

  export interface PluginConstructorOptions {
    throwError: PluginError,
    config: LooseObject
  }


  export class Plugin {
    cfg: CfgOptions;
    type: string;
    prototype: Plugin;

    constructor(throwError: string, config: PluginRuleConfig);

    pre();

    post();
  }

  export class Ast {
    node: Unist.Node;

    constructor(node: Unist.Node, parent: Unist.Node, text: string);

    traverse(plugins: Plugin[]): Ast;

    get(path: string): Ast | undefined;
  }
}

