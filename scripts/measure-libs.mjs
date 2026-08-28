/**
 * Measures standalone gzip size of dependency entry points.
 * Used to decide whether @tanstack/react-table stays for column defs only.
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

import { build } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const baselinePath = path.join(__dirname, '../docs/bundle-baseline.json')
const outDir = path.join(__dirname, '../.tmp/measure-lib')

const LIBRARIES = [
  {
    name: '@tanstack/react-table',
    entry: path.join(__dirname, 'measure-lib-entry.ts'),
    budgetKiB: 8,
  },
]

async function measureLibrary(entry) {
  await build({
    logLevel: 'silent',
    build: {
      write: true,
      emptyOutDir: true,
      outDir,
      lib: {
        entry,
        formats: ['es'],
        fileName: 'bundle',
      },
      rollupOptions: {
        external: ['react', 'react-dom', 'react/jsx-runtime'],
      },
    },
  })

  const buffer = await readFile(path.join(outDir, 'bundle.js'))
  return gzipSync(buffer).length
}

async function main() {
  const measurements = {}

  for (const lib of LIBRARIES) {
    const gzipBytes = await measureLibrary(lib.entry)
    measurements[lib.name] = {
      gzipBytes,
      gzipKiB: Number((gzipBytes / 1024).toFixed(1)),
      budgetKiB: lib.budgetKiB,
      withinBudget: gzipBytes / 1024 <= lib.budgetKiB,
    }
    console.log(
      `${lib.name}: ${measurements[lib.name].gzipKiB} KiB gzip (budget ${lib.budgetKiB} KiB)`,
    )
  }

  const baseline = JSON.parse(await readFile(baselinePath, 'utf8'))
  baseline.libraryMeasurements = measurements
  await writeFile(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`)
  console.log(`\nUpdated ${baselinePath}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
