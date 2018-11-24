// 映射关系
exports.ruleToLevel = rule => {
  return rule === 0 ? 'info' :
    rule === 1 ? 'warning' : 'error';
};
