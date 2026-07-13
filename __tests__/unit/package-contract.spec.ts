import { RuleExecutionFailure } from '../../src';

/**
 * 包入口契约：RuleExecutionFailure 必须能从公开入口导入，
 * 以便 npm 用户执行 `error instanceof RuleExecutionFailure`。
 *
 * 测试只依赖 TypeScript 源入口，确保 `npm test` 能在尚未构建 lib/esm 的干净
 * CI 工作区独立运行；构建产物仍由 CI 的后续 `npm run build` 验证。
 */
describe('package contract', () => {
  test('public entry exports RuleExecutionFailure and strict consumers can catch it', () => {
    expect(typeof RuleExecutionFailure).toBe('function');
    const e = new RuleExecutionFailure({
      ruleName: 'x',
      message: 'boom',
      round: 0,
      phase: 'fix'
    });
    expect(e).toBeInstanceOf(RuleExecutionFailure);
    expect(e.error).toMatchObject({ ruleName: 'x', phase: 'fix' });
  });
});
