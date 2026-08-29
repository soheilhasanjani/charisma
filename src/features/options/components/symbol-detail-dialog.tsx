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

const GREEKS = ['delta', 'gamma', 'theta', 'vega'] as const

type SymbolDetailDialogProps = {
  symbol: string | null
  onOpenChange: (open: boolean) => void
}

export function SymbolDetailDialog({
  symbol,
  onOpenChange,
}: SymbolDetailDialogProps) {
  const { t } = useTranslation()
  const record = useSymbolRecord(symbol ?? '')

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

        {symbol ? (
          <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            {GREEKS.map((greek) => {
              const value = record?.[greek]?.value

              return (
                <div
                  key={greek}
                  className="flex items-baseline justify-between gap-3"
                >
                  <dt className="text-muted-foreground">
                    {t(`detail.${greek}`)}:
                  </dt>
                  <dd dir="ltr" className="font-medium tabular-nums">
                    {value == null || !Number.isFinite(value)
                      ? t('common.empty')
                      : formatPrice(value)}
                  </dd>
                </div>
              )
            })}
          </dl>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
