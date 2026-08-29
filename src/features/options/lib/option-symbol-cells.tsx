import { parseOptionSymbol } from '@/features/options/lib/parse-option-symbol'

export function OptionTickerCell({ symbol }: { symbol: string }) {
  const parsed = parseOptionSymbol(symbol)

  return (
    <span dir="ltr" lang="en" className="font-medium" title={symbol}>
      {parsed?.ticker ?? symbol}
    </span>
  )
}
