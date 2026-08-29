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
import { cn } from '@/lib/utils'

type MarketGridHeaderProps = {
  className?: string
}

export function MarketGridHeader({ className }: MarketGridHeaderProps) {
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
          />
        ))}
      </div>
    </div>
  )
}

type MarketGridHeaderCellProps = {
  column: MarketColumnDef
  columnIndex: number
}

function MarketGridHeaderCell({
  column,
  columnIndex,
}: MarketGridHeaderCellProps) {
  const { t } = useTranslation()
  const header = t(columnTranslationKey(column.id, 'header'))
  const description = t(columnTranslationKey(column.id, 'description'))
  const descriptionId = `column-desc-${column.id}`

  return (
    <div
      role="columnheader"
      aria-colindex={columnIndex}
      className={cn(
        'flex min-w-0 items-center gap-1 px-2',
        alignmentClass(column.align),
        column.sticky &&
          'bg-background sticky [inset-inline-start:0] z-20 shadow-[1px_0_0_0_var(--border)]',
      )}
    >
      <span className="min-w-0 truncate font-medium">{header}</span>

      <TooltipProvider delay={200}>
        <Tooltip>
          <TooltipTrigger
            type="button"
            aria-label={t('columns.help', { column: header })}
            aria-describedby={descriptionId}
            className="text-muted-foreground hover:text-foreground inline-flex size-6 shrink-0 items-center justify-center rounded-sm"
          >
            <CircleHelp className="size-3.5" aria-hidden="true" />
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            {description}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* The description target lives outside the tooltip so aria-describedby
          still resolves while the tooltip is closed. */}
      <span id={descriptionId} className="sr-only">
        {description}
      </span>
    </div>
  )
}

function alignmentClass(align: MarketColumnDef['align']) {
  return align === 'end'
    ? 'justify-end text-end'
    : 'justify-start text-start'
}
