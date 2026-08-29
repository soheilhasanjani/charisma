/**
 * A row exactly as `GET /api/options/snapshot` returns it. Risk score is not part
 * of the payload — it is computed client-side and lives on SymbolRecord.
 */
export type OptionSnapshot = {
  symbol: string
  last: number
  bid: number
  ask: number
  delta: number
  gamma: number
  theta: number
  vega: number
}
