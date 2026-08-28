import { CircleHelp } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/primitives/tooltip'
import {
  columnTranslationKey,
  MARKET_COLUMNS,
  MARKET_GRID_TEMPLATE,
  type MarketColumnDef,
} from '@/features/options/components/column-model'
import { useGridSort } from '@/features/options/hooks/use-grid-sort'
import { useMarketRuntime } from '@/features/options/hooks/use-market-runtime'
import type { SortColumn } from '@/features/options/model/types'
import { cn } from '@/lib/utils'

type MarketGridHeaderProps = {
  className?: string
}

export function MarketGridHeader({ className }: MarketGridHeaderProps) {
  const sort = useGridSort()

  return (
    <div
      className={cn('bg-background border-b', className)}
      role="presentation"
    >
      <div
        role="row"
        aria-rowindex={1}
        className="grid h-10 items-stretch text-sm"
        style={
          {
            '--market-grid-columns': MARKET_GRID_TEMPLATE,
            gridTemplateColumns: 'var(--market-grid-columns)',
          } as CSSProperties
        }
      >
        {MARKET_COLUMNS.map((column, columnIndex) => (
          <MarketGridHeaderCell
            key={column.id}
            column={column}
            columnIndex={columnIndex + 1}
            sort={sort}
          />
        ))}
      </div>
    </div>
  )
}

type MarketGridHeaderCellProps = {
  column: MarketColumnDef
  columnIndex: number
  sort: ReturnType<typeof useGridSort>
}

function MarketGridHeaderCell({
  column,
  columnIndex,
  sort,
}: MarketGridHeaderCellProps) {
  const { t } = useTranslation()
  const runtime = useMarketRuntime()
  const header = t(columnTranslationKey(column.id, 'header'))
  const description = t(columnTranslationKey(column.id, 'description'))
  const isSorted =
    column.sortColumn != null && sort.column === column.sortColumn
  const ariaSort = isSorted
    ? sort.direction === 'asc'
      ? 'ascending'
      : 'descending'
    : 'none'

  const descriptionId = `column-desc-${column.id}`

  return (
    <div
      role="columnheader"
      aria-colindex={columnIndex}
      aria-sort={column.sortable ? ariaSort : undefined}
      className={cn(
        'flex min-w-0 items-center gap-1 px-2',
        alignmentClass(column.align),
        column.sticky &&
          'bg-background sticky [inset-inline-start:0] z-20 shadow-[1px_0_0_0_var(--border)]',
      )}
    >
      {column.sortable && column.sortColumn ? (
        <button
          type="button"
          className="hover:text-foreground min-w-0 truncate font-medium"
          onClick={() => {
            runtime.setSort(toggleSort(sort, column.sortColumn!))
          }}
        >
          {header}
        </button>
      ) : (
        <span className="min-w-0 truncate font-medium">{header}</span>
      )}

      <TooltipProvider delay={200}>
        <Tooltip>
          <TooltipTrigger
            type="button"
            tabIndex={-1}
            aria-label={t('columns.help', { column: header })}
            aria-describedby={descriptionId}
            className="text-muted-foreground hover:text-foreground inline-flex size-6 shrink-0 items-center justify-center rounded-sm"
            onKeyDown={(event) => {
              event.stopPropagation()
            }}
          >
            <CircleHelp className="size-3.5" aria-hidden="true" />
          </TooltipTrigger>
          <TooltipContent id={descriptionId} side="bottom" className="max-w-xs">
            {description}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

function toggleSort(
  current: ReturnType<typeof useGridSort>,
  column: SortColumn,
) {
  if (current.column === column) {
    return {
      column,
      direction: current.direction === 'asc' ? 'desc' : 'asc',
    } as const
  }

  return {
    column,
    direction: 'asc',
  } as const
}

function alignmentClass(align: MarketColumnDef['align']) {
  switch (align) {
    case 'end':
      return 'justify-end text-end'
    case 'center':
      return 'justify-center text-center'
    default:
      return 'justify-start text-start'
  }
}
