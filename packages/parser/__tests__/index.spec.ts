describe('index test', () => {
  test('assert package name', () => {
    const { parseMd } = require('../lib/lint-md-parser')
    expect(typeof parseMd).toStrictEqual('function')
  })
})
