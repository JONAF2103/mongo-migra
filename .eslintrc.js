module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'plugin:sonarjs/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    'no-debugger': 'error',
    'sonarjs/no-small-switch': ['off'],
    'sonarjs/no-nested-template-literals': ['off'],
    'sonarjs/no-empty-collection': ['off'],
    '@typescript-eslint/no-unnecessary-type-constraint': ['off'],
    'sonarjs/no-duplicate-string': ['off'],
    quotes: ['error', 'single', { 'allowTemplateLiterals': true }],
    'sonarjs/cognitive-complexity': ['error', 30],
  },
};
