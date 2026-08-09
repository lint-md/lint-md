import { parseMdWithSourceMap } from '@lint-md/parser';
import { createRuleManager } from '../../src/utils/rule-manager';
import { createLintSourceCode } from '../../src/utils/source-code';

const fakeRule = {
  rule: {
    meta: {
      name: 'fake-rule'
    }
  }
};

const createManager = (markdown = '') => {
  const { ast, sourceMap } = parseMdWithSourceMap(markdown);
  return createRuleManager(createLintSourceCode({ text: markdown, ast, sourceMap }));
};

describe('test rule context', () => {
  test('test rule context creation', () => {
    const ctx = createManager();
    expect(ctx).toBeTruthy();
    expect(typeof ctx.createRuleContext(fakeRule as any).report).toStrictEqual('function');
  });

  test('test rule context report() call', () => {
    const manager = createManager();
    manager.createRuleContext(fakeRule as any).report({
      message: 'message 1',
      loc: {
        start: {
          line: 1,
          column: 2
        },
        end: {
          line: 1,
          column: 3
        }
      }
    });
    manager.createRuleContext(fakeRule as any).report({
      message: 'message 2',
      loc: {
        start: {
          line: 4,
          column: 2
        },
        end: {
          line: 9,
          column: 3
        }
      }
    });
    expect(manager.getReportData().length).toStrictEqual(2);
    expect(manager.getReportData().map(item => item.message))
      .toStrictEqual(['message 1', 'message 2']);
  });
});
