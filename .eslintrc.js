module.exports = {
  extends: '@attachments/eslint-config',
  rules: {
    // typescript-eslint v8 removed these formatting rules from the plugin.
    '@typescript-eslint/brace-style': 'off',
    '@typescript-eslint/comma-spacing': 'off',
    '@typescript-eslint/indent': 'off',
    '@typescript-eslint/keyword-spacing': 'off',
    '@typescript-eslint/lines-between-class-members': 'off',
    '@typescript-eslint/member-delimiter-style': 'off',
    '@typescript-eslint/no-extra-parens': 'off',
    '@typescript-eslint/object-curly-spacing': 'off',
    '@typescript-eslint/quotes': 'off',
    '@typescript-eslint/semi': 'off',
    '@typescript-eslint/space-before-blocks': 'off',
    '@typescript-eslint/space-before-function-paren': 'off',
    '@typescript-eslint/space-infix-ops': 'off',
    '@typescript-eslint/type-annotation-spacing': 'off'
  },
  overrides: [
    {
      files: ['scripts/**/*.mjs', '__tests__/utils/**/*.ts'],
      rules: {
        'no-console': 'off'
      }
    }
  ]
};
