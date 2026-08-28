import type { ReactNode } from "react";

import { ModeToggle } from "@/components/mode-toggle";

const BRAND_NAME = "بازار آپشن";

type AppLayoutProps = {
  children?: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur-sm supports-backdrop-filter:bg-background/80">
        <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
          <p className="font-heading text-base font-semibold tracking-tight text-foreground sm:text-lg">
            {BRAND_NAME}
          </p>
          <ModeToggle />
        </div>
      </header>
      <main>{children}</main>
    </>
  );
}
