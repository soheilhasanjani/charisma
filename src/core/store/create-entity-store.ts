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
    if (keyListeners) {
      for (const listener of keyListeners) {
        listener()
      }
    }

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

      for (const key of flushed) {
        notifyKey(key)
      }

      return flushed
    },

    flushKey(key) {
      if (!dirty.delete(key)) return
      notifyKey(key)
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

/** Sentinel key for single-slot stores (LastTradeStore, FeedStatusStore). */
export const SINGLETON_KEY = Symbol('singleton')

export type SingletonStore<V> = EntityStore<typeof SINGLETON_KEY, V>

export function createSingletonStore<V>(): SingletonStore<V> {
  return createEntityStore<typeof SINGLETON_KEY, V>()
}
