import js from '@eslint/js'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    'stats.html',
    '.tmp/**',
    'public/mockServiceWorker.js',
    'src/mocks/**',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'react-refresh/only-export-components': [
        'error',
        {
          allowConstantExport: true,
          allowExportNames: [
            'badgeVariants',
            'buttonVariants',
            'useDirection',
            'useTheme',
          ],
        },
      ],
    },
  },
  {
    files: ['src/core/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              message:
                'core/ is React-free — use stores and hooks in features/.',
            },
            {
              name: 'react-dom',
              message:
                'core/ is React-free — use stores and hooks in features/.',
            },
            {
              name: 'react/jsx-runtime',
              message:
                'core/ is React-free — use stores and hooks in features/.',
            },
          ],
          patterns: [
            {
              group: ['@/features', '@/features/**'],
              message: 'core/ must not import from features/.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/options/**/*.{ts,tsx}'],
    ignores: ['src/features/options/model/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/!(options)/**', '@/features/!(options)'],
              message:
                'Feature slices must not cross-import — share via core/ or lib/.',
            },
            {
              group: ['@/core/realtime/socket-client'],
              message:
                'Import the socket only through createMarketRuntime() in model/.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    ignores: ['src/features/options/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/!(*)/**'],
              message:
                'Feature slices must not cross-import — share via core/ or lib/.',
            },
            {
              group: ['@/core/realtime/socket-client'],
              message:
                'Import the socket only through createMarketRuntime() in model/.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      'src/components/**/*.{ts,tsx}',
      'src/features/**/components/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/core/realtime/socket-client'],
              message:
                'Components read live data through hooks, not the socket.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.{test,spec}.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
    },
  },
  {
    files: ['scripts/**/*.{ts,mjs,js}'],
    languageOptions: {
      globals: globals.node,
    },
  },
])
