import { Plugin } from 'ast-plugin';
import { LooseObject, Type } from './common';

export type LintMdRules = LooseObject

export interface LintError {
  level: number
  type: string
}

export interface LintPluginClass extends Type<Plugin> {
  type: string
}

export interface ASTLocation {
  line: number
  column: number
}
