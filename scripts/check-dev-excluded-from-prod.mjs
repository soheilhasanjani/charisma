/**
 * Ensures dev-only perf tooling is absent from the production bundle.
 */
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distAssets = path.join(__dirname, '..', 'dist', 'assets')

const FORBIDDEN_MARKERS = [
  'src/dev/load-generator',
  'src/dev/perf-hud',
  'src/dev/perf-overlay',
  'src/dev/dev-perf-gate',
  'createLoadGenerator',
  'Synthetic 5000-symbol feed',
  'Perf HUD',
]

async function main() {
  let files
  try {
    files = (await readdir(distAssets)).filter((file) => file.endsWith('.js'))
  } catch {
    console.error('Missing dist/assets — run `npm run build` first.')
    process.exit(1)
  }

  const violations = []

  for (const file of files) {
    const content = await readFile(path.join(distAssets, file), 'utf8')
    for (const marker of FORBIDDEN_MARKERS) {
      if (content.includes(marker)) {
        violations.push(`${file}: contains "${marker}"`)
      }
    }
  }

  if (violations.length > 0) {
    console.error('Dev tooling leaked into production bundle:')
    for (const violation of violations) {
      console.error(`  - ${violation}`)
    }
    process.exit(1)
  }

  console.log('Production bundle excludes dev perf tooling.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
