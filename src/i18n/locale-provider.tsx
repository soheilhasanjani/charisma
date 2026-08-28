import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { setActiveFormatLocale } from '@/i18n/format-locale'
import {
  type AppLocale,
  changeAppLocale,
  localeToDirection,
  readStoredLocale,
} from '@/i18n/i18n'

type LocaleContextValue = {
  locale: AppLocale
  direction: 'rtl' | 'ltr'
  setLocale: (locale: AppLocale) => Promise<void>
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(() => readStoredLocale())
  const direction = localeToDirection(locale)

  useEffect(() => {
    setActiveFormatLocale(locale)
  }, [locale])

  const setLocale = useCallback(async (next: AppLocale) => {
    await changeAppLocale(next)
    setLocaleState(next)
    setActiveFormatLocale(next)
  }, [])

  const value = useMemo(
    () => ({
      locale,
      direction,
      setLocale,
    }),
    [direction, locale, setLocale],
  )

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  )
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider')
  }
  return context
}
