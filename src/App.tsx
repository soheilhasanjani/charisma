import { AppLayout } from '@/components/layouts/app-layout'
import { DirectionProvider } from '@/components/primitives/direction'
import { ThemeProvider } from '@/components/theme-provider'
import { OptionsPage } from '@/features/options/pages/options-page'
import { MarketRuntimeProvider } from '@/features/options/providers/market-runtime-provider'
import { QueryProvider } from '@/lib/query/query-provider'

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <QueryProvider>
        <MarketRuntimeProvider>
          <DirectionProvider direction="rtl">
            <AppLayout>
              {/* No React Router in this project. In a real app this would be a route, not a direct render. */}
              <OptionsPage />
            </AppLayout>
          </DirectionProvider>
        </MarketRuntimeProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}

export default App
