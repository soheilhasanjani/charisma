import type fa from '@/i18n/resources/fa'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: {
      translation: typeof fa
    }
  }
}

export {}
