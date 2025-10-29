module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2020: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: [
      './tsconfig.json',
      './apps/*/tsconfig.json',
      './packages/*/tsconfig.json'
    ],
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: { version: 'detect' },
    'import/resolver': {
      typescript: {
        project: [
          './tsconfig.json',
          './apps/*/tsconfig.json',
          './packages/*/tsconfig.json'
        ],
      },
    },
  },
  plugins: [
    'react',
    'react-hooks',
    '@typescript-eslint',
    'prettier',
    'import',
    'jsx-a11y',
  ],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:prettier/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:jsx-a11y/recommended',
  ],
  rules: {
    'prettier/prettier': 'error',
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_' }
    ],
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        pathGroups: [
          { pattern: '~/**', group: 'internal' },
          { pattern: '@/**', group: 'internal' },
          { pattern: '@components/**', group: 'internal' },
          { pattern: '@features/**', group: 'internal' },
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'import/no-unresolved': 'off',
    'react-hooks/exhaustive-deps': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '*.js',
    'build/',
    'coverage/'
  ],
};