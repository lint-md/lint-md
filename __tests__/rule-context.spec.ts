import { createRuleContext } from '../src/utils/rule-context';

describe('test rule context', () => {
  test('test rule context creation', () => {
    const ctx = createRuleContext();
    expect(ctx).toBeTruthy();
    expect(typeof ctx.report).toStrictEqual('function');
  });

  test('test rule context report() call', () => {
    const ctx = createRuleContext();
    ctx.report({
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
    ctx.report({
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
    expect(ctx.getReportData().length).toStrictEqual(2);
    expect(ctx.getReportData().map(item => item.message))
      .toStrictEqual(['message 1', 'message 2']);
  });
});
