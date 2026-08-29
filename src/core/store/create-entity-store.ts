/**
 * Generic keyed entity store with per-key pub/sub and dirty-set flushing.
 * Owned by feature stores (SymbolStore, HistoryStore, etc.) via the same factory shape.
 */

export type EntityStoreListener = () => void

export interface EntityStore<K, V> {
  get(key: K): V | undefined
  set(key: K, value: V): void
  markDirty(key: K): void
  flush(): ReadonlySet<K>
  flushKey(key: K): void
  flushKeys(keys: Iterable<K>): void
  subscribe(key: K, listener: EntityStoreListener): () => void
  subscribeAll(listener: EntityStoreListener): () => void
  keys(): IterableIterator<K>
}

export function createEntityStore<K, V>(): EntityStore<K, V> {
  const records = new Map<K, V>()
  const listeners = new Map<K, Set<EntityStoreListener>>()
  const globalListeners = new Set<EntityStoreListener>()
  const dirty = new Set<K>()

  function notifyKey(key: K) {
    const keyListeners = listeners.get(key)
    if (!keyListeners) return

    for (const listener of keyListeners) {
      listener()
    }
  }

  /**
   * Global subscribers are notified once per flush, never once per key. Firing
   * them per key would make a 500-symbol flush re-run every whole-store consumer
   * 500 times in a single frame, which defeats the batching the scheduler exists
   * to provide.
   */
  function notifyAll() {
    for (const listener of globalListeners) {
      listener()
    }
  }

  return {
    get(key) {
      return records.get(key)
    },

    set(key, value) {
      records.set(key, value)
      dirty.add(key)
    },

    markDirty(key) {
      dirty.add(key)
    },

    flush() {
      const flushed = new Set(dirty)
      dirty.clear()

      if (flushed.size === 0) {
        return flushed
      }

      for (const key of flushed) {
        notifyKey(key)
      }
      notifyAll()

      return flushed
    },

    flushKey(key) {
      if (!dirty.delete(key)) return
      notifyKey(key)
      notifyAll()
    },

    flushKeys(keys) {
      let flushedAny = false

      for (const key of keys) {
        if (!dirty.delete(key)) continue
        notifyKey(key)
        flushedAny = true
      }

      if (flushedAny) {
        notifyAll()
      }
    },

    subscribe(key, listener) {
      let keyListeners = listeners.get(key)
      if (!keyListeners) {
        keyListeners = new Set()
        listeners.set(key, keyListeners)
      }

      keyListeners.add(listener)
      return () => {
        keyListeners?.delete(listener)
        if (keyListeners?.size === 0) {
          listeners.delete(key)
        }
      }
    },

    subscribeAll(listener) {
      globalListeners.add(listener)
      return () => {
        globalListeners.delete(listener)
      }
    },

    keys() {
      return records.keys()
    },
  }
}
