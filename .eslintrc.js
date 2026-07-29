module.exports = {
  extends: '@attachments/eslint-config',
  overrides: [
    {
      files: ['scripts/**/*.mjs', '__tests__/utils/**/*.ts'],
      rules: {
        'no-console': 'off'
      }
    }
  ]
};
