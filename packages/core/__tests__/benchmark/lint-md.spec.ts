import { fix, lint } from 'lib';
import { lintAndFix } from '../../src/core/lint-and-fix';
import noEmptyCode from '../../src/rules/no-empty-code';
import { benchMarkBetween } from '../utils/test-utils';

describe('test benchmark with old version lint-md', () => {
  test('test lint and fix', async () => {
    const NO_EMPTY_CODE_DEMO = new Array(100).fill(`# Hello

Some **importance**, and \`code\`.

\`\`\`javascript

\`\`\`
`).join('\n');

    const newLintMd = () => {
      lintAndFix(NO_EMPTY_CODE_DEMO, [
        {
          rule: noEmptyCode
        }
      ], true);
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
      magnification: 85,
      cb1: newLintMd,
      cb2: oldLintMd,
      check: true
    });
  });
});
