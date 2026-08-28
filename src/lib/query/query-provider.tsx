import { lazy, Suspense, useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";

import { createQueryClient } from "@/lib/query/query-client";

const ReactQueryDevtools = lazy(() =>
  import("@tanstack/react-query-devtools").then((mod) => ({
    default: mod.ReactQueryDevtools,
  })),
);

type QueryProviderProps = {
  children: ReactNode;
};

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV ? (
        <Suspense fallback={null}>
          <ReactQueryDevtools
            initialIsOpen={false}
            buttonPosition="bottom-left"
          />
        </Suspense>
      ) : null}
    </QueryClientProvider>
  );
}
