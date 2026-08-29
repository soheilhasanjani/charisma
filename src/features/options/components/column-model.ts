export type ColumnId = 'ticker' | 'last' | 'bid' | 'ask' | 'riskScore'

export type ColumnAlignment = 'start' | 'end'

export type MarketColumnDef = {
  id: ColumnId
  width: string
  align: ColumnAlignment
  sticky?: boolean
}

export const MARKET_COLUMNS: MarketColumnDef[] = [
  {
    id: 'ticker',
    width: 'minmax(12rem, 1.4fr)',
    align: 'start',
    sticky: true,
  },
  {
    id: 'last',
    width: 'minmax(6rem, 0.9fr)',
    align: 'end',
  },
  {
    id: 'bid',
    width: 'minmax(6rem, 0.9fr)',
    align: 'end',
  },
  {
    id: 'ask',
    width: 'minmax(6rem, 0.9fr)',
    align: 'end',
  },
  {
    id: 'riskScore',
    width: 'minmax(6rem, 0.9fr)',
    align: 'end',
  },
]

export const MARKET_GRID_TEMPLATE = MARKET_COLUMNS.map(
  (column) => column.width,
).join(' ')

export function columnTranslationKey(
  id: ColumnId,
  field: 'header' | 'description',
) {
  return `columns.${id}.${field}` as const
}
