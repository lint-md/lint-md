const RULE_LEVEL_INFO = ['info', 'warning', 'error'];

// 映射关系
export const ruleToLevel = rule => {
  return RULE_LEVEL_INFO[rule];
};
