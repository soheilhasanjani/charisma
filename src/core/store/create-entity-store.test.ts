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

  it('notifies whole-store subscribers once per flush, not once per key', () => {
    const store = createEntityStore<string, number>()
    const spy = vi.fn()

    store.subscribeAll(spy)
    for (let index = 0; index < 500; index += 1) {
      store.set(`SYM_${index}`, index)
    }

    store.flush()

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('flushKeys notifies each dirty key but collapses the global notification', () => {
    const store = createEntityStore<string, number>()
    const globalSpy = vi.fn()
    const heard: string[] = []

    store.subscribeAll(globalSpy)
    store.subscribe('AAPL', () => heard.push('AAPL'))
    store.subscribe('TSLA', () => heard.push('TSLA'))
    store.set('AAPL', 1)
    store.set('TSLA', 2)
    store.set('MSFT', 3)

    store.flushKeys(['AAPL', 'TSLA'])

    expect(heard).toEqual(['AAPL', 'TSLA'])
    expect(globalSpy).toHaveBeenCalledTimes(1)
    expect(store.flush()).toEqual(new Set(['MSFT']))
  })

  it('does not notify anyone when a flush has nothing dirty', () => {
    const store = createEntityStore<string, number>()
    const globalSpy = vi.fn()

    store.subscribeAll(globalSpy)
    store.flush()
    store.flushKeys(['AAPL'])

    expect(globalSpy).not.toHaveBeenCalled()
  })
})
