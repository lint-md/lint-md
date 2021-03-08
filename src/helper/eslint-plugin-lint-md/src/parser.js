/*
 * File: constants.ts
 * Description: 面向 md 文件的 eslint 自定义 parser
 * Created: 2021-3-8 21:40:24
 * Author: yuzhanglong
 * Email: yuzl1123@163.com
 */

module.exports = {
  // md parser，使用一个定死的 ast，将 code 传给 Literal 的 value，
  // 这样，我们可以在 自定义的 eslint-rule 中的 Literal() 拿到它，然后查错 / fix it
  parseForESLint(code) {
    return {
      ast: {
        type: 'Program',
        start: 0,
        end: 0,
        loc: {
          start: {
            line: 1,
            column: 0
          },
          end: {
            line: 1,
            column: 0
          }
        },
        range: [0, 0],
        body: [
          {
            "type": "ExpressionStatement",
            "start": 0,
            "end": 1,
            "range": [
              0,
              1
            ],
            "expression": {
              "type": "Literal",
              "start": 0,
              "end": 1,
              "range": [
                0,
                1
              ],
              "value": code,
              "raw": "1"
            }
          }
        ],
        tokens: [],
        comments: []
      }
    }
  },
}
