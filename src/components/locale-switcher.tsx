import { LanguagesIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/primitives/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/primitives/dropdown-menu'
import { SUPPORTED_LOCALES } from '@/i18n/i18n'
import { useLocale } from '@/i18n/locale-provider'

export function LocaleSwitcher() {
  const { t } = useTranslation()
  const { locale, setLocale } = useLocale()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            aria-label={t('locale.switch')}
          />
        }
      >
        <LanguagesIcon className="size-[1.2rem]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_LOCALES.map((entry) => (
          <DropdownMenuItem
            key={entry}
            aria-current={locale === entry ? 'true' : undefined}
            onClick={() => {
              void setLocale(entry)
            }}
          >
            {t(`locale.${entry}`)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
