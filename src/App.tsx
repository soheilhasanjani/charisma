import { useTranslation } from 'react-i18next'

import { AppLayout } from '@/components/layouts/app-layout'
import { LocaleSwitcher } from '@/components/locale-switcher'
import { ModeToggle } from '@/components/mode-toggle'
import { DirectionProvider } from '@/components/primitives/direction'
import { ThemeProvider } from '@/components/theme-provider'
import { FeedStatusBadge } from '@/features/options/components/feed-status-badge'
import { LastTradeBanner } from '@/features/options/components/last-trade-banner'
import { OptionsPage } from '@/features/options/pages/options-page'
import { MarketRuntimeProvider } from '@/features/options/providers/market-runtime-provider'
import { LocaleProvider, useLocale } from '@/i18n/locale-provider'
import { QueryProvider } from '@/lib/query/query-provider'

function AppShell() {
  const { t } = useTranslation()
  const { direction } = useLocale()

  return (
    <DirectionProvider direction={direction}>
      <AppLayout
        brand={t('app.brand')}
        statusStart={<FeedStatusBadge />}
        headerEnd={
          <>
            <LocaleSwitcher />
            <ModeToggle />
          </>
        }
        banner={<LastTradeBanner />}
      >
        <OptionsPage />
      </AppLayout>
    </DirectionProvider>
  )
}

function App() {
  return (
    <LocaleProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <QueryProvider>
          <MarketRuntimeProvider>
            <AppShell />
          </MarketRuntimeProvider>
        </QueryProvider>
      </ThemeProvider>
    </LocaleProvider>
  )
}

export default App
