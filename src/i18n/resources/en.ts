import type { FaTranslation } from '@/i18n/resources/fa'

const en = {
  app: {
    brand: 'Options Market',
    title: 'Options Market',
  },
  common: {
    retry: 'Retry',
    clear: 'Clear',
    empty: '—',
    close: 'Close',
  },
  theme: {
    toggle: 'Toggle theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  },
  locale: {
    switch: 'Change language',
    fa: 'فارسی',
    en: 'English',
  },
  columns: {
    ticker: {
      header: 'Symbol',
      description: 'Option contract symbol.',
    },
    last: {
      header: 'Last',
      description: 'Last traded price.',
    },
    bid: {
      header: 'Bid',
      description: 'Best bid in the order book.',
    },
    ask: {
      header: 'Ask',
      description: 'Best ask in the order book.',
    },
    riskScore: {
      header: 'Risk score',
      description:
        'Composite risk score from Greeks (δ, γ, θ, ν), spread (ask−bid)/last, and Omega AI (500-iteration sin/cos loop on last and bid).',
    },
    help: 'Help for {{column}} column',
  },
  feed: {
    offline: 'Offline',
    watchdog: 'Silent connection — reconnecting',
    manualRetry: 'Connection failed — retry',
    connecting: 'Connecting…',
    slow: 'Slow connection',
    serverDisconnected: 'Server reported disconnected',
    connected: 'Connected',
    disconnected: 'Disconnected',
  },
  grid: {
    emptySnapshot: 'No data received from the server.',
    emptySnapshotHint: 'Check your network or API response.',
    emptyFilter: 'No symbols match the current filter.',
    emptyFilterHint: 'Clear the filter or choose different criteria.',
  },
  filter: {
    placeholder: 'Symbol filter',
    selectedCount: '{{count}} symbols selected',
    searchPlaceholder: 'Search symbol or ticker…',
    noResults: 'No symbols found.',
    selectGroup: 'Select group',
    deselectGroup: 'Deselect group',
    removeSymbol: 'Remove {{symbol}}',
  },
  trade: {
    latest: 'Last trade:',
    none: 'No trades yet',
    pause: 'Pause trade banner',
    resume: 'Resume trade banner',
    sideBuy: 'buy',
    sideSell: 'sell',
    sideBuyLabel: 'Buy',
    sideSellLabel: 'Sell',
    liveAnnouncement: '{{side}} trade {{symbol}} at {{price}}',
  },
  detail: {
    description: 'Delta, gamma, theta and vega',
    delta: 'Delta',
    gamma: 'Gamma',
    theta: 'Theta',
    vega: 'Vega',
  },
  errors: {
    timeout: 'The server took too long to respond. Try again.',
    network: 'Could not reach the server. Check your internet connection.',
    rateLimit: 'Too many requests. Try again shortly.',
    server: 'A server error occurred. Try again.',
    generic: 'Failed to load data. Try again.',
    boundary: 'Something went wrong while loading the app.',
    boundaryHint: 'Reload the page.',
  },
} satisfies FaTranslation

export default en
