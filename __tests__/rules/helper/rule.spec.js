import { ruleToLevel } from '../../../src/rules/helper/rule';

describe('rule', () => {
  test('ruleToLevel', () => {
    expect(ruleToLevel(0)).toEqual('info');
    expect(ruleToLevel(1)).toEqual('warning');
    expect(ruleToLevel(2)).toEqual('error');
  });
});
