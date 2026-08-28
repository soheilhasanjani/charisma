import { getActiveFormatLocale } from '@/i18n/format-locale'

const EMPTY_DATE_DISPLAY = '-'

const dateFormatters = new Map<string, Intl.DateTimeFormat>()

function getDateFormatter(locale: string) {
  const cached = dateFormatters.get(locale)

  if (cached) {
    return cached
  }

  const formatter = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  dateFormatters.set(locale, formatter)

  return formatter
}

function parseDateValue(value: string) {
  const compactDate = value.match(/^(\d{4})(\d{2})(\d{2})$/)
  const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const parts = compactDate ?? isoDate

  if (parts) {
    const year = Number(parts[1])
    const month = Number(parts[2])
    const day = Number(parts[3])
    const date = new Date(year, month - 1, day)

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null
    }

    return date
  }

  const timestamp = Date.parse(value)

  if (Number.isNaN(timestamp)) {
    return null
  }

  return new Date(timestamp)
}

/**
 * Formats a date string for display.
 * Accepts compact (`YYYYMMDD`), ISO date (`YYYY-MM-DD`), or any
 * `Date.parse`-able value. Empty and invalid inputs render as `"-"`.
 */
export function formatDate(value: string | null | undefined, locale?: string) {
  if (value == null || value.trim() === '') {
    return EMPTY_DATE_DISPLAY
  }

  try {
    const date = parseDateValue(value.trim())

    if (!date) {
      return EMPTY_DATE_DISPLAY
    }

    const resolvedLocale = locale ?? getActiveFormatLocale()
    return getDateFormatter(resolvedLocale).format(date)
  } catch {
    return EMPTY_DATE_DISPLAY
  }
}
