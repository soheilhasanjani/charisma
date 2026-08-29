import type { ReactNode } from 'react'

type AppLayoutProps = {
  children?: ReactNode
  brand?: ReactNode
  headerEnd?: ReactNode
}

export function AppLayout({ children, brand, headerEnd }: AppLayoutProps) {
  return (
    <>
      <header className="bg-background/95 supports-backdrop-filter:bg-background/80 sticky top-0 z-50 border-b pt-[env(safe-area-inset-top)] backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="font-heading text-foreground mx-auto text-base font-semibold tracking-tight sm:text-lg">
            {brand}
          </div>

          <div className="flex items-center gap-2">{headerEnd}</div>
        </div>
      </header>
      <main>{children}</main>
    </>
  )
}
