/**
 * Renders a component inside the same provider tree the app uses, so specs
 * exercise real i18n, direction and market-runtime wiring rather than stubs.
 */

import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'

import { DirectionProvider } from '@/components/primitives/direction'
import type { MarketRuntime } from '@/features/options/model/create-market-runtime'
import { MarketRuntimeProvider } from '@/features/options/providers/market-runtime-provider'
import { LocaleProvider } from '@/i18n/locale-provider'

export type RenderWithProvidersOptions = Omit<RenderOptions, 'wrapper'> & {
  runtime?: MarketRuntime
}

export function renderWithProviders(
  ui: ReactElement,
  { runtime, ...options }: RenderWithProvidersOptions = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <LocaleProvider>
        <DirectionProvider direction="rtl">
          <MarketRuntimeProvider runtime={runtime}>
            {children}
          </MarketRuntimeProvider>
        </DirectionProvider>
      </LocaleProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...options })
}
