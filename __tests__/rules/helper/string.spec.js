import { substr, startSpaceLen, endSpaceLen } from '../../../src/rules/helper/string';

describe('string', () => {
  test('substr', () => {
    expect(substr('hello, hustcc.')).toEqual('hello, hustc...');
    expect(substr('hello, hustcc.', 5)).toEqual('hello...');
    expect(substr('hello.', 50)).toEqual('hello.');
    expect(substr(undefined)).toEqual(undefined);
  });

  test('startSpaceLen', () => {
    expect(startSpaceLen('wang')).toEqual(0);
    expect(startSpaceLen(' wang')).toEqual(1);
    expect(startSpaceLen('   wang')).toEqual(3);
  });

  test('endSpaceLen', () => {
    expect(endSpaceLen('wang')).toEqual(0);
    expect(endSpaceLen('wang ')).toEqual(1);
    expect(endSpaceLen('wang   ')).toEqual(3);
  });
});
