import { RULE_SEVERITY } from '../types';

export const DEFAULT_RULE_SEVERITIES: Readonly<
  Partial<Record<string, RULE_SEVERITY>>
> = {
  'require-trailing-spaces': RULE_SEVERITY.OFF
};
