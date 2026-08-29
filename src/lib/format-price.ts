import { createPriceFormatter } from '@/i18n/format-locale'

export type FormatPriceOptions = {
  signed?: boolean
  compact?: boolean
}

/**
 * Formats a numeric price for display.
 * Uses `fa-IR-u-nu-latn` in Persian (Latin digits + Persian grouping) for dense tables.
 */
export function formatPrice(value: number, options: FormatPriceOptions = {}) {
  if (!Number.isFinite(value)) {
    return '—'
  }

  const formatter = createPriceFormatter({
    ...(options.signed ? { signDisplay: 'exceptZero' as const } : {}),
    ...(options.compact
      ? { notation: 'compact' as const, maximumFractionDigits: 2 }
      : {}),
  })

  return formatter.format(value)
}
