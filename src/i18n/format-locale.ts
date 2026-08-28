import type { AppLocale } from '@/i18n/i18n'

let activeFormatLocale = 'fa-IR-u-nu-latn'

const FORMAT_LOCALE_BY_APP: Record<AppLocale, string> = {
  fa: 'fa-IR-u-nu-latn',
  en: 'en-US',
}

const DATE_LOCALE_BY_APP: Record<AppLocale, string> = {
  fa: 'fa-IR',
  en: 'en-US',
}

export function setActiveFormatLocale(locale: AppLocale) {
  activeFormatLocale = FORMAT_LOCALE_BY_APP[locale]
  priceFormatters.clear()
}

export function getActiveFormatLocale() {
  return activeFormatLocale
}

export function getActiveDateLocale(locale: AppLocale) {
  return DATE_LOCALE_BY_APP[locale]
}

const priceFormatters = new Map<string, Intl.NumberFormat>()

function getPriceFormatter(options: Intl.NumberFormatOptions) {
  const key = `${activeFormatLocale}:${JSON.stringify(options)}`
  const cached = priceFormatters.get(key)
  if (cached) {
    return cached
  }

  const formatter = new Intl.NumberFormat(activeFormatLocale, options)
  priceFormatters.set(key, formatter)
  return formatter
}

export function createPriceFormatter(options: Intl.NumberFormatOptions = {}) {
  return getPriceFormatter({
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  })
}
