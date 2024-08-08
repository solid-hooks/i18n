import type { Accessor } from 'solid-js'

type ParseMessage<Locale extends string, T> = {
  [K in Locale]: Accessor<Promise<T>>
}

type Locale = 'en' | 'zh-CN'

export type Message = ParseMessage<Locale, {
  test: 'test'
  asd: 'asd'
  plural: 'welcome {name}, last login: {num}(0=today|1=one day ago|2-3,5=a few days ago|*=@ days ago)'
  nest: {
    description: 'nest props'
  }
}>
