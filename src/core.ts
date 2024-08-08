import { DEV, type JSXElement, Suspense, createComponent, createContext, createSignal, useContext } from 'solid-js'
import { makeEventListener } from '@solid-primitives/event-listener'
import type {
  DateTimeFormatItem,
  I18nObject,
  I18nObjectContext,
  I18nOptions,
  MessageType,
  NumberFormatItem,
} from './types'
import { translate } from './utils'

/**
 * initalize typesafe i18n and return `I18nProvider` and `useI18n`
 * @param options i18n options
 * @example
 * import { defineI18n, useStaticMessage, useDynamicMessage } from '@solid-hooks/i18n'
 *
 * const message = useStaticMessage(...) // useDynamicMessage(...) or other functions
 *
 * export const { useI18n, I18nProvider } = defineI18n({
 *   message,
 *   defaultLocale: 'en',
 *   datetimeFormats: {
 *     'en': {
 *       short: { dateStyle: 'short' },
 *       long: { dateStyle: 'long' },
 *       custom: d => d.getTime().toString(),
 *     },
 *     'zh-CN': {
 *       short: { dateStyle: 'short' },
 *       long: { dateStyle: 'full' },
 *       custom: d => d.getTime().toString(),
 *     },
 *   },
 *   numberFormats: {
 *     'en': {
 *       currency: { style: 'currency', currency: 'USD' },
 *     },
 *     'zh-CN': {
 *       currency: { style: 'currency', currency: 'CNY' },
 *     },
 *   },
 * })
 */
export function defineI18n<
  Locale extends string = string,
  Message extends MessageType<Locale> = any,
  NumberKey extends string = string,
  DatetimeKey extends string = string,
>(
  options: I18nOptions<Locale, Message, NumberKey, DatetimeKey>,
): I18nObjectContext<Locale, Message, NumberKey, DatetimeKey> {
  const ctx = createContext<I18nObject<Locale, Message, NumberKey, DatetimeKey>>()
  return {
    I18nProvider: (props) => {
      const { suspense, ...data } = setupI18n(options)
      function createPropvider(): JSXElement {
        return createComponent(ctx.Provider, {
          value: data,
          get children() {
            return props.children
          },
        })
      }
      return (props.useSuspense === false || !suspense)
        ? createPropvider()
        : createComponent(Suspense, {
          fallback: props.useSuspense === true ? undefined : props.useSuspense,
          get children() {
            return createPropvider()
          },
        })
    },
    useI18n: DEV
      ? () => {
          const _ = useContext(ctx)
          if (!_) {
            throw new Error('no <I18nProvider /> wrapped!')
          }
          return _
        }
      : () => useContext(ctx)!,
  }
}

type Suspenseable = {
  /**
   * whether to use <Suspense>
   */
  suspense?: boolean
}

/**
 * @internal
 */
export function setupI18n<
  Locale extends string = string,
  Message extends MessageType<Locale> = any,
  NumberKey extends string = string,
  DatetimeKey extends string = string,
>(
  options: I18nOptions<Locale, Message, NumberKey, DatetimeKey>,
): I18nObject<Locale, Message, NumberKey, DatetimeKey> & Suspenseable {
  const {
    message,
    defaultLocale = navigator?.language || 'en' as any,
    datetimeFormats,
    numberFormats,
    listenEvent,
  } = options
  const [locale, setLocale] = createSignal(defaultLocale)
  const { currentMessage, availableLocales, suspense } = message(locale)

  const datetimeFormatMap = new Map<string, Record<string, DateTimeFormatItem>>()
  const numberFormatMap = new Map<string, Record<string, NumberFormatItem>>()

  // setup datetime formatters
  for (const [l, datetimeFormat] of Object.entries(datetimeFormats || {})) {
    const obj = {} as Record<string, DateTimeFormatItem>
    for (const [key, config] of Object.entries(datetimeFormat || {})) {
      obj[key] = typeof config === 'function'
        ? config
        : new Intl.DateTimeFormat(l, config)
    }
    datetimeFormatMap.set(l, obj)
  }

  // setup number formatters
  for (const [l, numberFormat] of Object.entries(numberFormats || {})) {
    const obj = {} as Record<string, NumberFormatItem>
    for (const [key, config] of Object.entries(numberFormat || {})) {
      obj[key] = typeof config === 'function'
        ? config
        : new Intl.NumberFormat(l, config)
    }
    numberFormatMap.set(l, obj)
  }

  if (listenEvent) {
    makeEventListener(window, 'languagechange', () => {
      setLocale(navigator.language as any)
    })
  }

  return {
    suspense,
    t: (path, variables?) => translate(
      currentMessage(),
      path as any,
      variables as Record<string, any>,
    ),
    scopeT: scope => (path, variables?) => translate(
      currentMessage(),
      (scope + '.' + path) as any,
      variables as Record<string, any>,
    ),
    n: (num, type, l) => {
      const intl = numberFormatMap.get(l || locale())?.[type]
      return typeof intl === 'function'
        ? intl(num)
        : intl?.format(num) || num.toLocaleString(locale())
    },
    d: (date, type, l) => {
      const intl = datetimeFormatMap.get(l || locale())?.[type]
      return typeof intl === 'function'
        ? intl(date)
        : intl?.format(date) || date.toLocaleString(locale())
    },
    locale,
    setLocale,
    availableLocales,
  }
}
