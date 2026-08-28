import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import fa from '@/i18n/resources/fa'

export const LOCALE_STORAGE_KEY = 'app-locale'
export const SUPPORTED_LOCALES = ['fa', 'en'] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

export function isAppLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

export function readStoredLocale(): AppLocale {
  if (typeof window === 'undefined') {
    return 'fa'
  }

  const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
  return stored && isAppLocale(stored) ? stored : 'fa'
}

export function localeToDirection(locale: AppLocale): 'rtl' | 'ltr' {
  return locale === 'fa' ? 'rtl' : 'ltr'
}

export async function ensureLocaleBundle(locale: AppLocale) {
  if (locale === 'fa' || i18n.hasResourceBundle(locale, 'translation')) {
    return
  }

  const module = await import('@/i18n/resources/en')
  i18n.addResourceBundle('en', 'translation', module.default)
}

export async function changeAppLocale(locale: AppLocale) {
  await ensureLocaleBundle(locale)
  await i18n.changeLanguage(locale)

  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
    document.documentElement.dir = localeToDirection(locale)
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  }
}

export async function initI18n() {
  const locale = readStoredLocale()
  await i18n.use(initReactI18next).init({
    resources: {
      fa: { translation: fa },
    },
    lng: locale,
    fallbackLng: 'fa',
    interpolation: {
      escapeValue: false,
    },
  })

  await ensureLocaleBundle(locale)
  if (locale !== 'fa') {
    await i18n.changeLanguage(locale)
  }

  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
    document.documentElement.dir = localeToDirection(locale)
  }
}

export { i18n }
