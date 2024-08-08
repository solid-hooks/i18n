import { defineEslintConfig } from '@subframe7536/eslint-config'

export default defineEslintConfig({
  overrideRules: {
    'yaml/plain-scalar': 'off',
    'prefer-template': 'off',
  },
  ignoreAll: ['./playground/index.html'],
}).append({
  files: ['README.md/*.{ts,tsx}', 'playground/**.*'],
  rules: {
    'ts/explicit-function-return-type': 'off',
  },
})
