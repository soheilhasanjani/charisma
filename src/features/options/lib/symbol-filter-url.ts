const FILTER_PARAM = 'filter'

export function readSymbolFilterFromUrl(): string[] {
  if (typeof window === 'undefined') {
    return []
  }

  const raw = new URLSearchParams(window.location.search).get(FILTER_PARAM)
  if (!raw) {
    return []
  }

  return raw
    .split(',')
    .map((symbol) => decodeURIComponent(symbol))
    .filter(Boolean)
}

export function writeSymbolFilterToUrl(symbols: readonly string[]) {
  if (typeof window === 'undefined') {
    return
  }

  const url = new URL(window.location.href)
  if (symbols.length === 0) {
    url.searchParams.delete(FILTER_PARAM)
  } else {
    url.searchParams.set(
      FILTER_PARAM,
      symbols.map((symbol) => encodeURIComponent(symbol)).join(','),
    )
  }

  window.history.replaceState(window.history.state, '', url)
}
