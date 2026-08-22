// 0.2.2 基线经 npm alias 安装：#260 给包加了 exports 后，裸名 @lint-md/core
// 触发 self-reference，只会解析到当前源码，benchmark 的“新旧对比”随之失效。
import { fix, lint } from 'lint-md-core-legacy';
import { benchMarkBetween, getExample } from '../utils/test-utils';
import { lintMarkdown } from '../../src';

describe('test benchmark with old version lint-md', () => {
  test('test lint and fix', async () => {
    const NO_EMPTY_CODE_DEMO = new Array(10).fill(getExample('docs-for-all-rules')).join('\n');

    const newLintMd = () => {
      lintMarkdown(NO_EMPTY_CODE_DEMO, {}, true);
    };

    const oldLintMd = () => {
      lint(NO_EMPTY_CODE_DEMO, {
        'no-empty-code': 'error'
      });
      fix(NO_EMPTY_CODE_DEMO, {
        'no-empty-code': 'error'
      });
    };

    await benchMarkBetween({
      magnification: 30,
      cb1: newLintMd,
      cb2: oldLintMd,
      check: true
    });
  });
});
