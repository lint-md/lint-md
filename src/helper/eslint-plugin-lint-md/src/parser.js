module.exports = {
  parseForESLint(code, config) {
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
