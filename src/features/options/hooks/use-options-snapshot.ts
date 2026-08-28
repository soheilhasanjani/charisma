import { useQuery } from '@tanstack/react-query'

import { optionsSnapshotQueryOptions } from '@/features/options/api/options-snapshot'

export function useOptionsSnapshot() {
  return useQuery(optionsSnapshotQueryOptions())
}
