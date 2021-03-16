module.exports = {
  'preset': 'ts-jest',
  'testEnvironment': 'node',
  'collectCoverage': true,
  'collectCoverageFrom': [
    'src/**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/vendor/**'
  ]
};