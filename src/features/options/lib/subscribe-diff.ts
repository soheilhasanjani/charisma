export function diffSymbolSubscriptions(
  previous: readonly string[],
  next: readonly string[],
): boolean {
  if (previous.length !== next.length) {
    return true
  }

  for (let index = 0; index < previous.length; index += 1) {
    if (previous[index] !== next[index]) {
      return true
    }
  }

  return false
}

export function normalizeSubscriptionSymbols(
  selected: readonly string[],
  known: readonly string[],
): string[] {
  if (selected.length === 0) {
    return [...known]
  }

  const knownSet = new Set(known)
  return selected.filter((symbol) => knownSet.has(symbol))
}
