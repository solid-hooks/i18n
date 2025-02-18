import type { Path } from 'object-path-access'
import type { StringFallback } from './types'
import { pathGet } from 'object-path-access'

/**
 * Convert `'2-3,5'` to `[2, 3, 5]`
 *
 * DOES NOT SUPPORT NEGATIVE NUMBER like -1 or -2
 */
export function rangeStringToNumbers(rangeString: string): number[] {
  const result: number[] = []
  for (const part of rangeString.split(',')) {
    if (!part) {
      continue
    }
    const dashIdx = part.indexOf('-')
    if (dashIdx > -1) {
      const start = +part.slice(0, dashIdx)
      const end = +part.slice(dashIdx + 1)
      const min = Math.min(start, end)
      const max = Math.max(start, end)
      for (let i = min; i <= max; i++) {
        result.push(i)
      }
    } else {
      result.push(+part)
    }
  }
  return result
}

export function convertPlural(originalStr: string, configs: string, num: number): string {
  const ret = (str: string): string => str.replace(/@/g, `${num}`)

  // ['1=one test', '2-3=@ tests', '*=@ testss']
  for (const config of configs.split('|')) {
    // ['1', 'one test'] | ['2-3,5', '@ tests'] | ['*', '@ testss']
    const [condition, str] = config.split('=').map(s => s.trim())

    if (!condition || !str) {
      return originalStr
    }

    // ['*']
    if (condition === '*') {
      return ret(str)
    }

    // ['2-3,5', '@ tests']
    if (Number.isNaN(+condition)) {
      // ['2', '3', '5']
      const range = rangeStringToNumbers(condition)

      if (range.includes(num)) {
        // '2 tests'
        return ret(str)
      }
    } else if (num === +condition) {
      // ['1', 'one test']
      return ret(str)
    }
  }
  return originalStr
}

// {name}
export const varRegex = /\{([^{}]+)\}(?!\()/g
// {num}(1=one test|2-3,5=@ tests|*=@ testss)
export const pluralRegex = /\{(\w+)\}\(([^()]+)\)/g

/**
 * display message, support plural (DOES NOT SUPPORT NEGATIVE NUMBER like -1 or -2)
 * @param message message object
 * @param path object path, support nest and []
 * @param variable message variables, match `{key}` in message
 * @param fallback fallback string
 * @example
 * translate(
 *   { test: { hello: 'hello {name}, {num}(1=one day|2-3,5=a few days|*=@ days) ago' } },
 *   'test.hello',
 *   { name: 'test', num: 2 }
 * )
 * // 'hello test, a few days ago'
 */
export function translate<T extends Record<string, any>>(
  message: T | undefined,
  path: StringFallback<Path<T>>,
  variable?: Record<string, string | number>,
  fallback?: string,
): string {
  if (!message) {
    return fallback || ''
  }
  const msg = pathGet(message, path as Path<T>)
  return !msg
    ? ''
    : ('' + msg)
        .replace(varRegex, (_, key) => pathGet(variable, key))
        .replace(pluralRegex, (originalStr, key, configs) => {
          const num = +pathGet(variable, key)
          return Number.isNaN(num)
            ? originalStr
            : convertPlural(originalStr, configs, num)
        })
}
