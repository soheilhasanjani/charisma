function readEnv(key: keyof ImportMetaEnv): string {
  const value: unknown = import.meta.env[key]
  return typeof value === 'string' ? value : ''
}

export const env = {
  apiBaseUrl: readEnv('VITE_API_BASE_URL').replace(/\/$/, ''),
} as const
