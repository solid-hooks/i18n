import type { FilterPattern, Plugin } from 'vite'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join } from 'node:path'
import { relative } from 'node:path/posix'
import { createFilter, createLogger, normalizePath } from 'vite'
import { pluralRegex, varRegex } from './utils'

const logger = createLogger('info', { prefix: '[i18n]' })

export interface I18nPluginOptions {
  /**
   * Message files path include pattern
   * @example './src/i18n/locales/*.yml'
   */
  include: FilterPattern
  /**
   * Message files path exclude pattern
   */
  exclude?: FilterPattern
  /**
   * Raw message transform functions
   * @param content matched message file content
   * @param id matched message file  If trigger on watching value is {@link WATCH_ID}
   * @param root project root
   */
  transformMessage: (content: string, id: string, root: string) => any
}

export const WATCH_ID = '__i18n_watch__'

/**
 * create new I18nPlugin
 *
 * ### Usage
 *
 * ```ts
 * import { defineConfig } from 'vite'
 * import { parse } from 'yaml'
 * import { I18nPlugin, withTypeSupport } from '@solid-hooks/i18n/vite'
 *
 * export default defineConfig({
 *   plugins: [
 *     I18nPlugin({
 *       include: './src/i18n/locales/*.yml',
 *       transformMessage: withTypeSupport({
 *         baseTranslationFilePath: './i18n/locales/en.yml',
 *         transform: content => parse(content),
 *         output: './i18n/type.ts',
 *       }),
 *     }),
 *   ],
 * })
 * ```
 *
 * ### I18n-Ally
 * here is the config for i18n-ally plugin in VSCode:
 *
 * add `.vscode/i18n-ally-custom-framework.yml`
 *
 * ```yml
 * # more config: https://github.com/lokalise/i18n-ally/wiki/Custom-Framework
 * languageIds:
 *   - javascript
 *   - typescript
 *   - javascriptreact
 *   - typescriptreact
 * usageMatchRegex:
 *   - '[^\w\d]t\([''"`]({key})[''"`]'
 * monopoly: true
 * ```
 */
export function I18nPlugin(options: I18nPluginOptions): Plugin {
  const { include, exclude, transformMessage } = options

  let filter: (id: string) => boolean
  let root: string

  return {
    name: 'solid-hooks-i18n',
    configResolved(config) {
      root = config.root
      filter = createFilter(include, exclude, { resolve: root })
      logger.info(`read messages from "${root}"`, { timestamp: true })
    },
    configureServer(server) {
      server.watcher.on('change', (path) => {
        if (filter(path)) {
          transformMessage(readFileSync(path, 'utf-8'), WATCH_ID, root)
        }
      })
    },
    transform(code, id) {
      if (filter(id)) {
        const msg = transformMessage(code, id, root)
        logger.info(`transform message in "${relative(root, id)}"`, { timestamp: true })
        return `export default ${JSON.stringify(msg)}`
      }
    },
  }
}

interface WithTypeSupportOptions {
  /**
   * Base translation file  Use this file to generate type
   */
  baseTranslationFilePath: string
  /**
   * Like {@link I18nPluginOptions.transformMessage}
   * @default JSON.parse
   */
  transform?: (code: string) => any
  /**
   * Custom output file path, default `join(dirname(id), 'type.ts')`
   */
  output?: string
  /**
   * Whether to check translation keys
   * @default true
   */
  checkTranslationKeys?: boolean
}

/**
 * Transform message with variable type check support for `useDynamicMessage`
 *
 * Parse translation file to json, convert to type and write to file path
 */
export function withTypeSupport(options: WithTypeSupportOptions): I18nPluginOptions['transformMessage'] {
  const { baseTranslationFilePath, transform = JSON.parse, output, checkTranslationKeys = true } = options
  let rootPath: string
  const parsePath = (p: string): string => normalizePath(isAbsolute(p) ? p : join(rootPath, p))

  return (code, id, root) => {
    if (!rootPath) {
      rootPath = root
    }
    const translationObject = transform(readFileSync(parsePath(baseTranslationFilePath), 'utf-8'))
    if (id === WATCH_ID) {
      const outputPath = parsePath(output || join(dirname(baseTranslationFilePath), 'type.ts'))
      generateType(translationObject, outputPath)
      logger.info(`generate type to "${relative(root, outputPath)}"`, { timestamp: true })
    }
    const result = transform(code)
    if (checkTranslationKeys) {
      const [missingKeys, extraKeys] = getMissingTranslationKey(
        flattenNestObjectKeys(translationObject),
        flattenNestObjectKeys(result),
      )
      const hasMissingKeys = missingKeys.length > 0
      const hasExtraKeys = extraKeys.length > 0
      if (hasMissingKeys || hasExtraKeys) {
        let msg = ''
        if (hasMissingKeys) {
          msg += stringifyKeys(missingKeys, '-')
        }
        if (hasExtraKeys) {
          msg += stringifyKeys(extraKeys, '+')
        }
        logger.warn(`Translation key issue in ${relative(root, id)}:${msg}`, { timestamp: true })
      }
    }
    return result
  }
}

function generateType(obj: object, outputPath: string): void {
  const EMPTY_STRING = '__s__'
  function transformString(input: string): string {
    const varMatch = input.match(varRegex)
    const pluralMatch = input.match(pluralRegex)

    if (varMatch || pluralMatch) {
      return [...varMatch || [], ...pluralMatch || []].join('_').replace(/\(.*\)/g, '()')
    } else {
      return EMPTY_STRING
    }
  }

  function transformObject(obj: object): object {
    const result: Record<string, any> = {}

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        result[key as keyof typeof result] = transformString(value)
      } else {
        result[key as keyof typeof result] = transformObject(value as object)
      }
    }

    return result
  }
  const type = JSON.stringify(transformObject(obj), null, 2).replaceAll(`"${EMPTY_STRING}"`, 'string')
  writeFileSync(
    outputPath,
    `// prettier-ignore
/* eslint-disable */
/* generated by @solid-hooks/i18n vite plugin */
type ParseMessage<T> = {
  [K in string]: () => Promise<T>
}

export type MSG = ParseMessage<${type}>
`,
  )
}

function getMissingTranslationKey(baseKeys: string[], keys: string[]): [missingKeys: string[], extraKeys: string[]] {
  const missingKeys = baseKeys.filter(key => !keys.includes(key))
  const extraKeys = keys.filter(key => !baseKeys.includes(key))

  return [missingKeys, extraKeys]
}

function flattenNestObjectKeys(obj: object): string[] {
  const result: string[] = []
  const queue: Array<[any, string]> = [[obj, '']]

  while (queue.length > 0) {
    const [current, path] = queue.shift()!

    if (typeof current !== 'object' || current === null) {
      continue
    }

    for (const key of Object.keys(current)) {
      const newPath = path ? `${path}.${key}` : key
      result.push(newPath)

      if (typeof current[key] === 'object' && current[key] !== null) {
        queue.push([current[key], newPath])
      }
    }
  }

  return result
}

function stringifyKeys(arr: string[], heading: string): string {
  const base = `\n                ${heading} `
  return base + arr.join(base)
}
