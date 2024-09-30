import { defineEslintConfig, GLOB_MARKDOWN_CODE } from '@subframe7536/eslint-config'

export default defineEslintConfig({
  solid: true,
  overrideRules: {
    'yaml/plain-scalar': 'off',
    'prefer-template': 'off',
  },
  ignoreAll: ['./playground/index.html'],
  ignoreRuleOnFile: [
    {
      files: [GLOB_MARKDOWN_CODE, 'playground/**.*'],
      rules: ['ts/explicit-function-return-type'],
    },
  ],
})
