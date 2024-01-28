import { For, createSignal } from 'solid-js'
import { useI18n } from './i18n'

export default function Component() {
  const { t, d, n, scopeT, availableLocales, locale, setLocale } = useI18n()
  const [num, setNum] = createSignal(0)
  const st = scopeT('nest')
  function changeLocale(target: string) {
    setLocale(target)
  }
  setInterval(() => {
    setNum(num => (num + 1) % 6)
  }, 1000)
  return (
    <>
      <select onChange={e => changeLocale(e.target.value)}>
        <For each={availableLocales}>
          {l => <option selected={l === locale()}>{l}</option>}
        </For>
      </select>
      <div>{t('test')}</div>
      <hr />
      <div>{t('nest.description')}:</div>
      <div>{st('description')}(scope):</div>
      <div>{t('plural', { name: 'test', num: num() })}</div>
      <hr />
      Date and Number:
      <div>{d(new Date(), 'custom')}</div>
      <div>{d(new Date(), 'long')}</div>
      <div>{d(new Date(), 'long', 'en')}</div>
      <div>{n(100, 'currency')}</div>
    </>
  )
}
