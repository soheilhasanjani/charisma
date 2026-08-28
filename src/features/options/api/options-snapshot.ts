import { queryOptions } from "@tanstack/react-query";

import { http } from "@/lib/http/client";
import type { OptionSnapshot } from "@/features/options/types";

const OPTIONS_SNAPSHOT_PATH = "/api/options/snapshot";

export const optionsQueryKeys = {
  all: ["options"] as const,
  snapshot: () => [...optionsQueryKeys.all, "snapshot"] as const,
};

export function getOptionsSnapshot(options?: { signal?: AbortSignal }) {
  return http.get<OptionSnapshot[]>(OPTIONS_SNAPSHOT_PATH, {
    signal: options?.signal,
  });
}

export function optionsSnapshotQueryOptions() {
  return queryOptions({
    queryKey: optionsQueryKeys.snapshot(),
    queryFn: ({ signal }) => getOptionsSnapshot({ signal }),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}
