import { QueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/http/errors";

const MAX_QUERY_RETRIES = 3;
const DEFAULT_STALE_TIME_MS = 30_000;
const MAX_RETRY_DELAY_MS = 30_000;

export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_QUERY_RETRIES) {
    return false;
  }

  if (!(error instanceof ApiError)) {
    return true;
  }

  if (error.isCanceled) {
    return false;
  }

  if (error.isNetworkError || error.isTimeout) {
    return true;
  }

  if (error.status === 408 || error.status === 429) {
    return true;
  }

  return error.status !== undefined && error.status >= 500;
}

export function queryRetryDelay(attemptIndex: number): number {
  return Math.min(1_000 * 2 ** attemptIndex, MAX_RETRY_DELAY_MS);
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetryQuery,
        retryDelay: queryRetryDelay,
        staleTime: DEFAULT_STALE_TIME_MS,
        refetchOnWindowFocus: true,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
