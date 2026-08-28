import { parseOptionSymbol } from '@/features/options/lib/parse-option-symbol'

export type SymbolGroup = {
  ticker: string
  symbols: string[]
}

export function groupSymbolsByUnderlying(
  symbols: readonly string[],
): SymbolGroup[] {
  const groups = new Map<string, string[]>()

  for (const symbol of symbols) {
    const ticker = parseOptionSymbol(symbol)?.ticker ?? symbol
    const bucket = groups.get(ticker)
    if (bucket) {
      bucket.push(symbol)
    } else {
      groups.set(ticker, [symbol])
    }
  }

  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([ticker, groupSymbols]) => ({
      ticker,
      symbols: groupSymbols.sort((left, right) => left.localeCompare(right)),
    }))
}

export function filterSymbolsByQuery(
  symbols: readonly string[],
  query: string,
): string[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return [...symbols]
  }

  return symbols.filter((symbol) => {
    const parsed = parseOptionSymbol(symbol)
    if (symbol.toLowerCase().includes(normalized)) {
      return true
    }

    return parsed?.ticker.toLowerCase().includes(normalized) ?? false
  })
}
