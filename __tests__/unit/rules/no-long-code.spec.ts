import { createFixer } from '../../utils/test-utils';
import noLongCode from '../../../src/rules/no-long-code';


describe('test no-long-code', () => {
  const fixer = createFixer([{
    rule: noLongCode,
    options: {
      length: 50,
      exclude: ['plain']
    }
  }]);

  test('test no fix applied', () => {
    const md = [
      '```js',
      'console.log("this is a short line");',
      'console.log("with multiple lines");',
      '```'
    ].join('\n');

    const { fixedResult, lintResult } = fixer(md);

    expect(fixedResult?.result).toBe(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(0);
  });

  test('test fix applied', () => {
    const longCode = 'console.log("very long long long long long long long long long long long long long long long long long sentence");';
    const md = [
      '```js',
      longCode,
      '```'
    ].join('\n');

    const { lintResult } = fixer(md);
    const options = lintResult.ruleManager.getReportData().pop();

    expect(options?.loc).toStrictEqual({
      'end': {
        'column': 114,
        'line': 1
      },
      'start': {
        'column': 1,
        'line': 1
      }
    });
  });

  test('test exclude option', () => {
    const longCode = 'console.log("very long long long long long long long long long long long long long long long long long sentence");';
    const md = [
      '```plain',
      longCode,
      '```'
    ].join('\n');
    const { lintResult } = fixer(md);

    const data = lintResult.ruleManager.getReportData();
    expect(data.length).toStrictEqual(0);
  });

  test('test lint error in lines more than one', () => {
    const md = [
      '```js',
      'console.log("this is a short line");',
      'console.log("code code code code code code code code");',
      'console.log("this is a short line");',
      'console.log("code code code code code code code code");',
      '```'
    ].join('\n');

    const { fixedResult, lintResult } = fixer(md);

    expect(fixedResult?.result).toStrictEqual(md);
    const [r1, r2] = lintResult.ruleManager.getReportData();
    expect(r1.loc).toStrictEqual({
      'end': {
        'column': 55,
        'line': 2
      },
      'start': {
        'column': 1,
        'line': 2
      }
    });
    expect(r2.loc).toStrictEqual({
      'end': {
        'column': 55,
        'line': 4
      },
      'start': {
        'column': 1,
        'line': 4
      }
    });
  });
});
