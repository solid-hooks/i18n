import { defineEslintConfig } from '@subframe7536/eslint-config'

export default defineEslintConfig({
  overrideRules: {
    'yaml/plain-scalar': 'off',
    'prefer-template': 'off',
  },
})
