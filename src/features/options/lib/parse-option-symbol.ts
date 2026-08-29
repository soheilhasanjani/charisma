const optionTypeByCode = {
  C: 'call',
  P: 'put',
} as const

export type OptionType =
  (typeof optionTypeByCode)[keyof typeof optionTypeByCode]

export type ParsedOptionSymbol = {
  ticker: string
  expiry: string
  strike: number
  type: OptionType
}

const parseCache = new Map<string, ParsedOptionSymbol | null>()

export function parseOptionSymbol(symbol: string): ParsedOptionSymbol | null {
  if (parseCache.has(symbol)) {
    return parseCache.get(symbol) ?? null
  }

  const parsed = parseOptionSymbolUncached(symbol)
  parseCache.set(symbol, parsed)
  return parsed
}

function parseOptionSymbolUncached(symbol: string): ParsedOptionSymbol | null {
  const parts = symbol.split('_')

  if (parts.length < 4) {
    return null
  }

  const typeCode = parts.at(-1)?.toUpperCase()
  const strikeRaw = parts.at(-2)
  const expiry = parts.at(-3)
  const ticker = parts.slice(0, -3).join('_')

  if (
    !ticker ||
    !expiry ||
    !strikeRaw ||
    (typeCode !== 'C' && typeCode !== 'P')
  ) {
    return null
  }

  if (!/^\d{8}$/.test(expiry) || !/^\d+(?:\.\d+)?$/.test(strikeRaw)) {
    return null
  }

  const year = Number(expiry.slice(0, 4))
  const month = Number(expiry.slice(4, 6))
  const day = Number(expiry.slice(6, 8))
  const expiryDate = new Date(year, month - 1, day)

  if (
    expiryDate.getFullYear() !== year ||
    expiryDate.getMonth() !== month - 1 ||
    expiryDate.getDate() !== day
  ) {
    return null
  }

  return {
    ticker,
    expiry,
    strike: Number(strikeRaw),
    type: optionTypeByCode[typeCode],
  }
}

export function clearParseOptionSymbolCacheForTests() {
  parseCache.clear()
}
