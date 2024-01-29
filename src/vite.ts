import { relative } from 'node:path/posix'
import { createFilter, createLogger } from 'vite'
import type { FilterPattern, Plugin } from 'vite'

export interface I18nPluginOptions {
  /**
   * message files path include pattern
   * @example './src/i18n/locales/*.yml'
   */
  include: FilterPattern
  /**
   * message files path exclude pattern
   */
  exclude?: FilterPattern
  /**
   * raw message transform functions
   * @param content matched message file content
   * @param id matched message file path
   */
  transformMessage: (content: string, id: string) => any
}

/**
 * create new I18nPlugin
 *
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

  const logger = createLogger('info', { prefix: '[i18n]' })
  let filter: (id: string) => boolean
  let root: string

  return {
    name: 'solid-hooks-i18n',
    configResolved(config) {
      root = config.root
      filter = createFilter(include, exclude, { resolve: root })
      logger.info(`read messages from "${root}"`, { timestamp: true })
    },
    transform(code, id) {
      if (filter(id)) {
        const msg = transformMessage(code, id)
        logger.info(`transform message in "${relative(root, id)}"`, { timestamp: true })
        return `export default ${JSON.stringify(msg)}`
      }
    },
  }
}
