describe('index test', () => {
  test('assert package name', () => {
    const { parseMd } = require('../dist')
    expect(typeof parseMd).toStrictEqual('function')
  })
})
