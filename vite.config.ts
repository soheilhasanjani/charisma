import path from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    mode === 'analyze' &&
      visualizer({
        filename: 'stats.html',
        gzipSize: true,
        brotliSize: true,
        open: false,
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('src/i18n/resources/en')) {
            return 'locale-en'
          }
          if (
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react/')
          ) {
            return 'vendor-react'
          }
          // Measured both ways: splitting Base UI out or letting it fall into
          // the entry chunk gives the same eager total (~196 KiB gzip), because
          // most of what the lazy panel and dialog use is shared anyway. Keeping
          // the vendor chunk means an app-code change invalidates ~65 KiB
          // instead of ~126 KiB for returning visitors.
          if (id.includes('node_modules/@base-ui')) {
            return 'vendor-base-ui'
          }
        },
      },
    },
  },
}))
