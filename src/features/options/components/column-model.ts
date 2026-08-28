import type { SortColumn } from '@/features/options/model/types'

export type ColumnId =
  | 'ticker'
  | 'strike'
  | 'type'
  | 'expiry'
  | 'last'
  | 'bid'
  | 'ask'
  | 'spread'
  | 'lastTradeSide'
  | 'riskScore'

export type ColumnAlignment = 'start' | 'end' | 'center'

export type MarketColumnDef = {
  id: ColumnId
  width: string
  align: ColumnAlignment
  sortable?: boolean
  sortColumn?: SortColumn
  sticky?: boolean
}

export const MARKET_COLUMNS: MarketColumnDef[] = [
  {
    id: 'ticker',
    width: 'minmax(7rem, 1.1fr)',
    align: 'start',
    sortable: true,
    sortColumn: 'symbol',
    sticky: true,
  },
  {
    id: 'strike',
    width: 'minmax(6rem, 0.9fr)',
    align: 'end',
  },
  {
    id: 'type',
    width: 'minmax(4rem, 0.6fr)',
    align: 'center',
  },
  {
    id: 'expiry',
    width: 'minmax(6rem, 0.9fr)',
    align: 'start',
  },
  {
    id: 'last',
    width: 'minmax(6rem, 0.9fr)',
    align: 'end',
    sortable: true,
    sortColumn: 'last',
  },
  {
    id: 'bid',
    width: 'minmax(6rem, 0.9fr)',
    align: 'end',
    sortable: true,
    sortColumn: 'bid',
  },
  {
    id: 'ask',
    width: 'minmax(6rem, 0.9fr)',
    align: 'end',
    sortable: true,
    sortColumn: 'ask',
  },
  {
    id: 'spread',
    width: 'minmax(5rem, 0.7fr)',
    align: 'end',
  },
  {
    id: 'lastTradeSide',
    width: 'minmax(5rem, 0.7fr)',
    align: 'center',
  },
  {
    id: 'riskScore',
    width: 'minmax(6rem, 0.9fr)',
    align: 'end',
    sortable: true,
    sortColumn: 'riskScore',
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
