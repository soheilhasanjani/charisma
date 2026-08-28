import './styles.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { RootErrorBoundary } from '@/components/root-error-boundary'
import { initI18n } from '@/i18n/i18n'

import App from './App.tsx'

async function enableReactScan() {
  if (!import.meta.env.DEV) return
  if (!window.location.search.includes('scan=1')) return

  const { scan } = await import('react-scan')
  scan({
    enabled: true,
    log: true,
  })
}

async function enableMocks() {
  if (!import.meta.env.DEV) return
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'true') return

  const { worker } = await import('./mocks/browser.ts')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

async function bootstrap() {
  await initI18n()
  await enableReactScan()
  await enableMocks()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    </StrictMode>,
  )
}

void bootstrap()
