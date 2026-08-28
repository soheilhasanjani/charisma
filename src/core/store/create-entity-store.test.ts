import { describe, expect, it, vi } from 'vitest'

import { createEntityStore } from '@/core/store/create-entity-store'

describe('createEntityStore', () => {
  it('notifies only dirty keys on flush', () => {
    const store = createEntityStore<string, number>()
    const heard: string[] = []

    store.subscribe('AAPL', () => heard.push('AAPL'))
    store.subscribe('TSLA', () => heard.push('TSLA'))

    store.set('AAPL', 1)
    store.set('TSLA', 2)
    heard.length = 0

    const flushed = store.flush()

    expect([...flushed]).toEqual(['AAPL', 'TSLA'])
    expect(heard).toEqual(['AAPL', 'TSLA'])
  })

  it('does not notify clean keys', () => {
    const store = createEntityStore<string, number>()
    const spy = vi.fn()

    store.set('AAPL', 1)
    store.flush()
    store.subscribe('AAPL', spy)
    store.flush()

    expect(spy).not.toHaveBeenCalled()
  })

  it('flushKey notifies a single dirty key', () => {
    const store = createEntityStore<string, number>()
    const heard: string[] = []

    store.subscribe('AAPL', () => heard.push('AAPL'))
    store.subscribe('TSLA', () => heard.push('TSLA'))
    store.set('AAPL', 1)
    store.set('TSLA', 2)

    store.flushKey('AAPL')

    expect(heard).toEqual(['AAPL'])
    expect(store.flush()).toEqual(new Set(['TSLA']))
  })
})
