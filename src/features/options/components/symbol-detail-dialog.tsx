import { useTranslation } from 'react-i18next'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/primitives/dialog'
import { useSymbolRecord } from '@/features/options/hooks/use-market-data'
import { formatPrice } from '@/lib/format-price'

type SymbolDetailDialogProps = {
  symbol: string | null
  onOpenChange: (open: boolean) => void
}

export function SymbolDetailDialog({
  symbol,
  onOpenChange,
}: SymbolDetailDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={symbol != null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <span dir="ltr">{symbol}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t('detail.description')}
          </DialogDescription>
        </DialogHeader>

        {symbol ? <SymbolDetailBody symbol={symbol} /> : null}
      </DialogContent>
    </Dialog>
  )
}

function SymbolDetailBody({ symbol }: { symbol: string }) {
  const { t } = useTranslation()
  const record = useSymbolRecord(symbol)

  return (
    <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
      <Metric label={t('detail.delta')} value={record?.delta?.value} />
      <Metric label={t('detail.gamma')} value={record?.gamma?.value} />
      <Metric label={t('detail.theta')} value={record?.theta?.value} />
      <Metric label={t('detail.vega')} value={record?.vega?.value} />
    </dl>
  )
}

function Metric({
  label,
  value,
}: {
  label: string
  value: number | undefined
}) {
  const { t } = useTranslation()

  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{label}:</dt>
      <dd dir="ltr" className="font-medium tabular-nums">
        {value == null || !Number.isFinite(value)
          ? t('common.empty')
          : formatPrice(value)}
      </dd>
    </div>
  )
}
