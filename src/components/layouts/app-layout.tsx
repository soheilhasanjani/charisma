import type { ReactNode } from 'react'

import { ModeToggle } from '@/components/mode-toggle'

const BRAND_NAME = 'بازار آپشن'

type AppLayoutProps = {
  children?: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <>
      <header className="bg-background/95 supports-backdrop-filter:bg-background/80 sticky top-0 z-50 border-b pt-[env(safe-area-inset-top)] backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
          <p className="font-heading text-foreground text-base font-semibold tracking-tight sm:text-lg">
            {BRAND_NAME}
          </p>
          <ModeToggle />
        </div>
      </header>
      <main>{children}</main>
    </>
  )
}
