import { WS_OPTIONS_URL } from '@/core/config/feed-config'

function readEnv(key: keyof ImportMetaEnv): string {
  const value: unknown = import.meta.env[key]
  return typeof value === 'string' ? value : ''
}

export const env = {
  apiBaseUrl: readEnv('VITE_API_BASE_URL').replace(/\/$/, ''),
  wsUrl: readEnv('VITE_WS_URL').trim() || WS_OPTIONS_URL,
} as const
