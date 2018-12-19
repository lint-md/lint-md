// 映射关系
export const ruleToLevel = rule => {
  return rule === 0 ? 'info' :
    rule === 1 ? 'warning' : 'error';
};
