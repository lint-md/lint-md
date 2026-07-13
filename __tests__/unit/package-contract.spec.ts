import * as fs from 'fs';
import * as path from 'path';

/**
 * 包入口契约：RuleExecutionFailure 必须能从公开入口导入，
 * 以便 npm 用户执行 `error instanceof RuleExecutionFailure`。
 *
 * CJS：直接 require 运行时产物（lib/index.js）。
 * ESM：仓库 ESM 产物（esm/index.js）未带 .js 扩展名，不可被 Node 原生 import，
 *      故校验构建产物确实声明了该导出（与 lintMarkdown 同入口）。
 */
describe('package contract', () => {
  const root = path.resolve(__dirname, '..', '..');

  test('CJS entry exports RuleExecutionFailure as a function', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cjs = require(path.join(root, 'lib', 'index.js'));
    expect(typeof cjs.RuleExecutionFailure).toBe('function');
  });

  test('ESM entry declares RuleExecutionFailure export', () => {
    const esmEntry = path.join(root, 'esm', 'index.js');
    expect(fs.existsSync(esmEntry)).toBe(true);
    const content = fs.readFileSync(esmEntry, 'utf-8');
    expect(content).toMatch(/RuleExecutionFailure/);
  });

  test('strict consumer can catch RuleExecutionFailure', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { RuleExecutionFailure } = require(path.join(root, 'lib', 'index.js'));
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
