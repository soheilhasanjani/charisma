/** Snapshot fields use revision 0; live messages always win with revision >= 1. */
export const SNAPSHOT_REVISION = 0

let liveRevision = 0

export function nextLiveRevision(): number {
  liveRevision += 1
  return liveRevision
}

export function resetLiveRevisionForTests() {
  liveRevision = 0
}

export type Stamped<T> = {
  value: T
  revision: number
}

export function stampLive<T>(value: T): Stamped<T> {
  return { value, revision: nextLiveRevision() }
}

export function stampSnapshot<T>(value: T): Stamped<T> {
  return { value, revision: SNAPSHOT_REVISION }
}

export function shouldFillField(
  current: Stamped<unknown> | undefined,
): boolean {
  return current == null || current.revision === SNAPSHOT_REVISION
}

export function fillField<T>(
  current: Stamped<T> | undefined,
  value: T,
): Stamped<T> | undefined {
  if (!shouldFillField(current)) {
    return current
  }

  return stampSnapshot(value)
}
