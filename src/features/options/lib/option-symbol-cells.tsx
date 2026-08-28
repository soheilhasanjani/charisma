import {
  EMPTY_DISPLAY,
  type OptionType,
  parseOptionSymbol,
} from '@/features/options/lib/parse-option-symbol'
import { formatDate } from '@/lib/format-date'

const strikeFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const optionTypeLabel: Record<OptionType, string> = {
  call: 'Call',
  put: 'Put',
}

const optionTypeClassName: Record<OptionType, string> = {
  call: 'text-green-600 dark:text-green-400',
  put: 'text-red-600 dark:text-red-400',
}

export function OptionTickerCell({ symbol }: { symbol: string }) {
  const parsed = parseOptionSymbol(symbol)

  return (
    <span dir="ltr" lang="en" className="font-medium" title={symbol}>
      {parsed?.ticker ?? symbol}
    </span>
  )
}

export function OptionStrikeCell({ symbol }: { symbol: string }) {
  const parsed = parseOptionSymbol(symbol)

  if (!parsed) {
    return <span>{EMPTY_DISPLAY}</span>
  }

  return (
    <span dir="ltr" lang="en" className="tabular-nums">
      {strikeFormatter.format(parsed.strike)}
    </span>
  )
}

export function OptionTypeCell({ symbol }: { symbol: string }) {
  const parsed = parseOptionSymbol(symbol)

  if (!parsed) {
    return <span>{EMPTY_DISPLAY}</span>
  }

  return (
    <span dir="ltr" lang="en" className={optionTypeClassName[parsed.type]}>
      {optionTypeLabel[parsed.type]}
    </span>
  )
}

export function OptionExpiryCell({ symbol }: { symbol: string }) {
  const parsed = parseOptionSymbol(symbol)

  if (!parsed) {
    return <span>{EMPTY_DISPLAY}</span>
  }

  return <span dir="ltr">{formatDate(parsed.expiry, 'fa-IR')}</span>
}
