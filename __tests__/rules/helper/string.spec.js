const { substr } = require('../../../rules/helper/string');

describe('string', () => {
  test('substr', () => {
    expect(substr('hello, hustcc.')).toEqual('hello, hustc...');
    expect(substr('hello, hustcc.', 5)).toEqual('hello...');
    expect(substr('hello.', 50)).toEqual('hello.');
    expect(substr(undefined)).toEqual(undefined);
  });
});
