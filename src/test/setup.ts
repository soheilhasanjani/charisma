import '@testing-library/jest-dom/vitest'

import { beforeAll } from 'vitest'

import { initI18n } from '@/i18n/i18n'

const VIEWPORT_HEIGHT = 600
const VIEWPORT_WIDTH = 1200

/**
 * jsdom reports every element as 0x0 and has no ResizeObserver, so a virtualizer
 * would render zero rows and component tests could never assert on cells. Giving
 * elements a plausible box makes windowing behave close enough to a browser for
 * integration tests.
 */
function stubLayout() {
  // Benchmarks run in the node environment, where there is nothing to stub.
  if (typeof Element === 'undefined') {
    return
  }

  if (!('ResizeObserver' in globalThis)) {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  }

  Element.prototype.getBoundingClientRect = function getBoundingClientRect() {
    return {
      width: VIEWPORT_WIDTH,
      height: VIEWPORT_HEIGHT,
      top: 0,
      left: 0,
      right: VIEWPORT_WIDTH,
      bottom: VIEWPORT_HEIGHT,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }
  }

  for (const [property, value] of [
    ['offsetHeight', VIEWPORT_HEIGHT],
    ['offsetWidth', VIEWPORT_WIDTH],
    ['clientHeight', VIEWPORT_HEIGHT],
    ['clientWidth', VIEWPORT_WIDTH],
  ] as const) {
    Object.defineProperty(HTMLElement.prototype, property, {
      configurable: true,
      value,
    })
  }
}

beforeAll(async () => {
  stubLayout()
  await initI18n()
})
