/**
 * Contract between the client's feed configuration and the mock server.
 *
 * The mock is a fixed vendor file, so the client has to match its registered URL
 * exactly. Nothing else in the suite covers this: a mismatch here type-checks,
 * lints and passes every unit test while silently disabling the entire live feed.
 */

import { describe, expect, it } from 'vitest'

import { resolveWebSocketUrl } from '@/core/config/feed-config'
import { wsHandlers } from '@/mocks/ws-handlers'

const [optionsHandler] = wsHandlers

describe('mock feed contract', () => {
  it('resolves a WebSocket URL that the mock handler matches', () => {
    expect(optionsHandler.test(resolveWebSocketUrl())).toBe(true)
  })

  it('does not match an origin-derived URL, which is why the port must be omitted', () => {
    expect(optionsHandler.test('ws://localhost:5173/ws/options')).toBe(false)
  })
})
