import type { Accessor } from 'solid-js'
import { DEV, createMemo, createResource } from 'solid-js'
import type { DynamicMessage, GenerateMessageFn } from './types'

/**
 * load static message
 * @param message static message
 * @example
 * import { defineI18n, useStaticMessage } from '@solid-hooks/i18n'
 *
 * // use `as const` to make parameters typesafe
 * const en = { t: '2', deep: { data: 'Hello, {name}' }, plural: '{day}(0=zero|1=one)' } as const
 * const zh = { t: '1', deep: { data: '你好{name}' }, plural: '{day}日' } as const
 *
 * export const { useI18n, I18nProvider } = defineI18n({
 *   message: useStaticMessage({ 'en': en, 'zh-CN': zh }),
 *   // other options...
 * })
 */
export function useStaticMessage<
  Locale extends string,
  Message extends Record<Locale, Record<string, any>>,
>(
  message: Message,
): GenerateMessageFn<Locale, Message> {
  const messages = new Map<string, any>(Object.entries(message))
  return locale => ({
    availableLocales: Object.keys(message) as Locale[],
    currentMessage: createMemo(() => messages.get(locale())),
  })
}

/**
 * load from dynamic message
 * @param imports `import.meta.glob('...')`
 * @param parseKey parse key string
 * @example
 * ### Usage
 * ```tsx
 * import { defineI18n, useDynamicMessage } from '@solid-hooks/i18n'
 *
 * export const { useI18n, I18nProvider } = defineI18n({
 *   message: useDynamicMessage(
 *     import.meta.glob('./locales/*.yml'),
 *     path => path.slice(10, -4)
 *   ),
 *   // other options...
 * })
 *
 * return (
 *   <I18nProvider useSuspense={<div>loading...</div>}>
 *     {...}
 *   </I18nProvider>
 * )
 * ```
 * ### Vite
 * ```ts
 * import { defineConfig } from 'vite'
 * import { parse } from 'yaml'
 * import { I18nPlugin } from '@solid-hooks/i18n/vite'
 *
 * export default defineConfig({
 *   plugins: [
 *     I18nPlugin({
 *       include: './src/i18n/locales/*.yml',
 *       transformMessage: content => parse(content),
 *     }),
 *   ],
 * })
 * ```
 */
export function useDynamicMessage<Locale extends string>(
  imports: DynamicMessage,
  parseKey: (key: string) => string,
): GenerateMessageFn<Locale, DynamicMessage> {
  const messageMap = new Map<string, Accessor<Promise<{ default: any }>>>()
  const availableLocales: Locale[] = []
  for (const [key, value] of Object.entries(imports)) {
    const k = parseKey(key) as Locale
    availableLocales.push(k)
    messageMap.set(k, value as Accessor<Promise<{ default: any }>>)
  }
  if (DEV) {
    console.log(`dynamic load locale: [${availableLocales}]`)
  }
  return (locale) => {
    const [currentMessage] = createResource(locale, async (l) => {
      document?.documentElement.setAttribute('lang', l)
      if (!messageMap.has(l)) {
        if (DEV) {
          console.warn(`unsupported locale: ${l}`)
        }
        throw new Error(`unsupported locale: ${l}`)
      }
      const getMessage = messageMap.get(l)!
      return (await getMessage()).default
    })
    return {
      currentMessage,
      availableLocales,
      suspense: true,
    }
  }
}
