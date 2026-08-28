import type { ReactNode } from 'react'

import { ModeToggle } from '@/components/mode-toggle'

const BRAND_NAME = 'بازار آپشن'

type AppLayoutProps = {
  children?: ReactNode
  /** Pinned to the physical left edge, even in RTL. */
  statusStart?: ReactNode
  banner?: ReactNode
}

export function AppLayout({ children, statusStart, banner }: AppLayoutProps) {
  return (
    <>
      <header className="bg-background/95 supports-backdrop-filter:bg-background/80 sticky top-0 z-50 border-b pt-[env(safe-area-inset-top)] backdrop-blur-sm">
        <div className="relative flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
          {statusStart ? (
            <div className="absolute top-1/2 left-4 z-10 -translate-y-1/2">
              {statusStart}
            </div>
          ) : null}

          <p className="font-heading text-foreground mx-auto text-base font-semibold tracking-tight sm:text-lg">
            {BRAND_NAME}
          </p>

          <ModeToggle />
        </div>

        {banner ? (
          <div className="border-t px-4 py-2 sm:px-6">{banner}</div>
        ) : null}
      </header>
      <main>{children}</main>
    </>
  )
}
