module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['build', 'artifacts', 'dist-css', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  rules: {},
}
