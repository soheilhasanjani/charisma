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
  header: string
  descriptionKey: string
  description: string
  width: string
  align: ColumnAlignment
  sortable?: boolean
  sortColumn?: SortColumn
  sticky?: boolean
}

export const MARKET_COLUMNS: MarketColumnDef[] = [
  {
    id: 'ticker',
    header: 'نماد',
    descriptionKey: 'columns.ticker',
    description: 'نماد پایه قرارداد آپشن.',
    width: 'minmax(7rem, 1.1fr)',
    align: 'start',
    sortable: true,
    sortColumn: 'symbol',
    sticky: true,
  },
  {
    id: 'strike',
    header: 'قیمت اعمال',
    descriptionKey: 'columns.strike',
    description: 'قیمت اعمال قرارداد آپشن.',
    width: 'minmax(6rem, 0.9fr)',
    align: 'end',
  },
  {
    id: 'type',
    header: 'نوع',
    descriptionKey: 'columns.type',
    description: 'Call یا Put.',
    width: 'minmax(4rem, 0.6fr)',
    align: 'center',
  },
  {
    id: 'expiry',
    header: 'سررسید',
    descriptionKey: 'columns.expiry',
    description: 'تاریخ سررسید قرارداد.',
    width: 'minmax(6rem, 0.9fr)',
    align: 'start',
  },
  {
    id: 'last',
    header: 'آخرین قیمت',
    descriptionKey: 'columns.last',
    description: 'آخرین قیمت معامله‌شده.',
    width: 'minmax(6rem, 0.9fr)',
    align: 'end',
    sortable: true,
    sortColumn: 'last',
  },
  {
    id: 'bid',
    header: 'قیمت عرضه',
    descriptionKey: 'columns.bid',
    description: 'بهترین قیمت خرید در دفتر سفارش.',
    width: 'minmax(6rem, 0.9fr)',
    align: 'end',
    sortable: true,
    sortColumn: 'bid',
  },
  {
    id: 'ask',
    header: 'قیمت تقاضا',
    descriptionKey: 'columns.ask',
    description: 'بهترین قیمت فروش در دفتر سفارش.',
    width: 'minmax(6rem, 0.9fr)',
    align: 'end',
    sortable: true,
    sortColumn: 'ask',
  },
  {
    id: 'spread',
    header: 'اسپرد',
    descriptionKey: 'columns.spread',
    description: 'اختلاف قیمت تقاضا و عرضه (ask − bid).',
    width: 'minmax(5rem, 0.7fr)',
    align: 'end',
  },
  {
    id: 'lastTradeSide',
    header: 'سمت معامله',
    descriptionKey: 'columns.lastTradeSide',
    description: 'سمت آخرین معامله ثبت‌شده برای نماد.',
    width: 'minmax(5rem, 0.7fr)',
    align: 'center',
  },
  {
    id: 'riskScore',
    header: 'امتیاز ریسک',
    descriptionKey: 'columns.riskScore',
    description:
      'امتیاز ریسک ترکیبی از سه جزء: Greeks (δ، γ، θ، ν)، اسپرد (ask−bid)/last، و Omega AI (حلقه ۵۰۰-تایی sin/cos روی last و bid).',
    width: 'minmax(6rem, 0.9fr)',
    align: 'end',
    sortable: true,
    sortColumn: 'riskScore',
  },
]

export const MARKET_GRID_TEMPLATE = MARKET_COLUMNS.map(
  (column) => column.width,
).join(' ')
