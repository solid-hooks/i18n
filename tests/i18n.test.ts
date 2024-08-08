import { beforeEach, describe, expect, it } from 'vitest'
import { useStaticMessage } from '../src'
import { setupI18n } from '../src/core'
import { en } from './locale/en'
import { zh } from './locale/zh'

describe('i18n', () => {
  const { availableLocales, setLocale, t, d, n, scopeT } = setupI18n({
    message: useStaticMessage({ en, zh }),
    defaultLocale: 'en',
    numberFormats: {
      en: {
        currency: { style: 'currency', currency: 'USD' },
      },
      zh: {
        currency: { style: 'currency', currency: 'CNY' },
      },
    },
    datetimeFormats: {
      en: {
        short: { dateStyle: 'short' },
        long: { dateStyle: 'long' },
        custom: d => d.getTime().toString(),
      },
      zh: {
        short: { dateStyle: 'short' },
        long: { dateStyle: 'long' },
        custom: d => d.getTime().toString(),
      },
    },
  })
  const scopeTranslate = scopeT('nest')
  beforeEach(() => {
    setLocale('en')
  })

  async function changeLocale() {
    setLocale('zh')
    await Promise.resolve()
  }

  it('translation', async () => {
    expect(availableLocales).toStrictEqual(['en', 'zh'])
    expect(t('text')).toBe('text')
    expect(scopeTranslate('text', { value: 1 })).toBe('nest 1')

    await changeLocale()

    expect(t('text')).toBe('文本')
    expect(t('nest.text', { value: 1 })).toBe('嵌套 1')
  })
  it('variable', async () => {
    expect(t('var', { name: 'test', num: 1 })).toBe('welcome test, last login: one day ago')
    expect(t('var', { name: 'test', num: 2 })).toBe('welcome test, last login: a few days ago')
    expect(t('var', { name: 'test', num: 3 })).toBe('welcome test, last login: a few days ago')
    expect(t('var', { name: 'test', num: 4 })).toBe('welcome test, last login: a few days ago')
    expect(t('var', { name: 'test', num: 5 })).toBe('welcome test, last login: 5 days ago')
    expect(t('var', { name: 'test', num: 6 })).toBe('welcome test, last login: a few days ago')

    await changeLocale()

    expect(t('var', { name: 'test', num: 0 })).toBe('欢迎 test, 上次登录: 0 天前')
    expect(t('var', { name: 'test', num: 4 })).toBe('欢迎 test, 上次登录: 4 天前')
  })
  it('number', async () => {
    expect(n(1, 'currency')).toBe('$1.00')

    await changeLocale()

    expect(n(1, 'currency')).toBe('¥1.00')
  })

  it('date', async () => {
    const date = new Date('2000-01-01')
    expect(d(date, 'short')).toBe('1/1/00')
    expect(d(date, 'long')).toBe('January 1, 2000')
    expect(d(date, 'custom')).toBe('946684800000')

    await changeLocale()
    expect(d(date, 'short')).toBe('2000/1/1')
    expect(d(date, 'long')).toBe('2000年1月1日')
    expect(d(date, 'custom')).toBe('946684800000')
  })
})
