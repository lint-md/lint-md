module.exports = {
  "preset": "ts-jest/presets/js-with-ts",
  "testEnvironment": "node",
  "collectCoverage": true,
  "collectCoverageFrom": [
    "src/**/*.{js,jsx,ts,tsx}",
    "!**/node_modules/**",
    "!**/vendor/**"
  ],
  testMatch: [
    '**/__tests__/*.spec.ts'
  ]
}