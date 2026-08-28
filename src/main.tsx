import './styles.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

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
  const { worker } = await import('./mocks/browser.ts')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

async function bootstrap() {
  await enableReactScan()
  await enableMocks()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
