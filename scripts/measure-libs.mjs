/**
 * Measures standalone gzip size of dependency entry points.
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const baselinePath = path.join(__dirname, '../docs/bundle-baseline.json')

const LIBRARIES = []

async function main() {
  const measurements = {}

  if (LIBRARIES.length === 0) {
    console.log('No libraries configured for standalone measurement.')
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
