module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  ignorePatterns: ['dist', '*.cjs'],
  parser: '@typescript-eslint/parser',
  rules: {
    '@typescript-eslint/no-explicit-any': ['off'],
    '@typescript-eslint/no-unused-vars': ['off'],
    '@typescript-eslint/no-duplicate-enum-values': ['warn'],
    'no-constant-condition': ['off'],
    'no-useless-escape': ['off'],
    '@typescript-eslint/no-unnecessary-type-constraint': ['off'],
    '@typescript-eslint/no-this-alias': ['off'],
    'no-inner-declarations': ['off'],
    'prefer-const': ['off'],
    'no-var': ['off'],
    'no-prototype-builtins': ['off'],
    '@typescript-eslint/ban-types': ['off'],
    '@typescript-eslint/no-namespace': ['off'],
    'no-empty': ['off'],
    'no-console': ['error'],
    'no-debugger': ['error'],
    'prefer-rest-params': ['off'],
  },
};
