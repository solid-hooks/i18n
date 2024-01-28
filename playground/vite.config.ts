import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import { parse } from 'yaml'
import { I18nPlugin } from '../src/vite'

export default defineConfig({
  plugins: [
    solid(),
    I18nPlugin({
      include: './i18n/locales/*.yml',
      transformMessage: content => parse(content),
    }),
  ],
})
