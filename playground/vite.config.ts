import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import { parse } from 'yaml'
import { I18nPlugin, withTypeSupport } from '../src/vite'

export default defineConfig({
  plugins: [
    solid(),
    I18nPlugin({
      include: './i18n/locales/*.yml',
      transformMessage: withTypeSupport({
        baseTranslationFilePath: './i18n/locales/en.yml',
        transform: content => parse(content),
        output: './i18n/type.ts',
      }),
    }),
  ],
})
