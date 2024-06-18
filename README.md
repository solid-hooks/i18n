<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=@solid-hooks/i18n&background=tiles&project=%20" alt="@solid-hooks/i18n">
</p>

# @solid-hooks/i18n

i18n for solid.js

## Install

```shell
npm i @solid-hooks/i18n
```
```shell
yarn add @solid-hooks/i18n
```
```shell
pnpm add @solid-hooks/i18n
```

## Usage

### Static message

```tsx
import { For } from 'solid-js'
import { defineI18n, useStaticMessage } from '@solid-hooks/i18n'

// use `as const` to make parameters typesafe
const en = { t: '2', deep: { data: 'Hello, {name}' }, plural: '{day}(0=zero|1=one)' } as const
const zh = { t: '1', deep: { data: '你好{name}' }, plural: '{day}日' } as const

export const { useI18n, I18nProvider } = defineI18n({
  message: useStaticMessage({ 'en': en, 'zh-CN': zh }),
  defaultLocale: 'en',
  datetimeFormats: {
    'en': {
      short: { dateStyle: 'short' },
      long: { dateStyle: 'long' },
      custom: d => d.getTime().toString(),
    },
    'zh-CN': {
      short: { dateStyle: 'short' },
      long: { dateStyle: 'full' },
      custom: d => d.getTime().toString(),
    },
  },
  numberFormats: {
    'en': {
      currency: { style: 'currency', currency: 'USD' },
    },
    'zh-CN': {
      currency: { style: 'currency', currency: 'CNY' },
    },
  },
})

// usage
const { t, scopeT, d, n, availiableLocales, locale, setLocale } = useI18n(/* optional typesafe scope */)
const scopeT = scopeT('deep')

return (
  <I18nProvider>
    <select onChange={e => setLocale(e.target.value)}>
      <For each={availiableLocales}>
        {l => <option selected={l === locale()}>{l}</option>}
      </For>
    </select>
    <div>{t('t')}</div>
    <br />
    {/* typesafe parameters */}
    <div>{t('t')}</div>
    <div>{t('deep.data', { name: 'test' })}</div>
    <div>{t('plural', { day: 1 })}</div>
    <div>{scopeT('data', { name: 'test' })}</div>
    <div>{d(new Date())}</div>
    <div>{d(new Date(), 'long')}</div>
    <div>{d(new Date(), 'long', 'en')}</div>
    <div>{n(100, 'currency')}</div>
  </I18nProvider>
)
```

### Dynamic message

use [`import.meta.glob`](https://vitejs.dev/guide/features.html#glob-import) to dynamically load message

```tsx
import { defineI18n, useDynamicMessage } from '@solid-hooks/i18n'

export const { useI18n, I18nProvider } = defineI18n({
  message: useDynamicMessage(
    import.meta.glob('./locales/*.yml'),
    path => path.slice(10, -4)
  ),
  // other options...
})

return (
  <I18nProvider useSuspense={<div>loading...</div>}>
    {/* ... */}
  </I18nProvider>
)
```

#### Vite plugin

to convert `yml` or other formats of message, setup built-in vite plugin

vite.config.ts
```ts
import { defineConfig } from 'vite'
import { parse } from 'yaml'
import { I18nPlugin } from '@solid-hooks/i18n/vite'

export default defineConfig({
  plugins: [
    I18nPlugin({
      include: './src/i18n/locales/*.yml',
      transformMessage: content => parse(content),
    }),
  ],
})
```

### Syntax

#### Variable

`{variable}`

e.g.
```ts
const en = { var: 'show {variable}' } as const
t('var', { variable: 'text' }) // show text
```

#### Plural

`{variable}(case=text|case=text)`

- case: support number (seprated by `,`) / range (seprated by `-`) / `*` (fallback cases)
- text: plural text, use `@` to show matched variable

e.g.
```ts
const en = { plural: 'at {var}(1=one day|2-3,5=a few days|*=@ days) ago' } as const
t('plural', { var: 1 }) // at one day ago
t('plural', { var: 2 }) // at a few days ago
t('plural', { var: 4 }) // at 4 days ago
t('plural', { var: 5 }) // at a few days ago
```

### [I18n-Ally](https://github.com/lokalise/i18n-ally) VSCode plugin

add in `.vscode/i18n-ally-custom-framework.yml`

```yml
# more config: https://github.com/lokalise/i18n-ally/wiki/Custom-Framework
languageIds:
  - javascript
  - typescript
  - javascriptreact
  - typescriptreact
usageMatchRegex:
  - '[^\w\d]t\([''"`]({key})[''"`]'
monopoly: true
```

## RTL

credit to `React-spectrum`

```ts
import { getReadingDirection, isRTL } from '@solid-hooks/i18n'

console.log(isRTL('ae')) // true
console.log(getReadingDirection('Mend')) // 'rtl'
```

## License

MIT
