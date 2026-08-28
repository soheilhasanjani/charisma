/**
 * Compares production bundle gzip sizes against docs/bundle-baseline.json.
 * Fails when any chunk grows beyond the configured regression threshold.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const distAssets = path.join(root, 'dist/assets')
const baselinePath = path.join(root, 'docs/bundle-baseline.json')

/** Allow up to 5% growth or 1 KiB, whichever is larger. */
const REGRESSION_RATIO = 0.05
const REGRESSION_FLOOR_BYTES = 1024

async function measureAssets() {
  const files = (await readdir(distAssets)).filter((file) =>
    /\.(js|css)$/.test(file),
  )

  const chunks = {}
  let total = 0

  for (const file of files.sort()) {
    const filePath = path.join(distAssets, file)
    const buffer = await readFile(filePath)
    const gzip = gzipSync(buffer).length
    chunks[file] = gzip
    total += gzip
  }

  return {
    measuredAt: new Date().toISOString(),
    totalGzipBytes: total,
    chunks,
  }
}

function formatKiB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`
}

function budgetForBaseline(bytes) {
  return (
    bytes +
    Math.max(REGRESSION_FLOOR_BYTES, Math.ceil(bytes * REGRESSION_RATIO))
  )
}

async function main() {
  const args = new Set(process.argv.slice(2))
  const updateBaseline = args.has('--update')

  const report = await measureAssets()

  if (updateBaseline) {
    await writeFile(baselinePath, `${JSON.stringify(report, null, 2)}\n`)
    console.log(
      `Baseline updated: ${formatKiB(report.totalGzipBytes)} total gzip`,
    )
    for (const [file, size] of Object.entries(report.chunks)) {
      console.log(`  ${file}: ${formatKiB(size)}`)
    }
    return
  }

  let baseline
  try {
    baseline = JSON.parse(await readFile(baselinePath, 'utf8'))
  } catch {
    console.error(
      'Missing docs/bundle-baseline.json — run `npm run analyze -- --update-baseline` after a clean build.',
    )
    process.exit(1)
  }

  const failures = []
  const allChunkNames = new Set([
    ...Object.keys(baseline.chunks),
    ...Object.keys(report.chunks),
  ])

  for (const name of [...allChunkNames].sort()) {
    const current = report.chunks[name]
    const previous = baseline.chunks[name]

    if (current == null) {
      failures.push(`${name}: removed (${formatKiB(previous)} baseline)`)
      continue
    }

    if (previous == null) {
      failures.push(`${name}: new chunk (${formatKiB(current)})`)
      continue
    }

    const budget = budgetForBaseline(previous)
    if (current > budget) {
      failures.push(
        `${name}: ${formatKiB(current)} > ${formatKiB(budget)} budget (baseline ${formatKiB(previous)})`,
      )
    }
  }

  const totalBudget = budgetForBaseline(baseline.totalGzipBytes)
  if (report.totalGzipBytes > totalBudget) {
    failures.push(
      `total: ${formatKiB(report.totalGzipBytes)} > ${formatKiB(totalBudget)} budget (baseline ${formatKiB(baseline.totalGzipBytes)})`,
    )
  }

  console.log(`Bundle gzip total: ${formatKiB(report.totalGzipBytes)}`)
  for (const [file, size] of Object.entries(report.chunks)) {
    const previous = baseline.chunks[file]
    const delta =
      previous == null
        ? 'new'
        : `${size - previous >= 0 ? '+' : ''}${formatKiB(size - previous)}`
    console.log(`  ${file}: ${formatKiB(size)} (${delta})`)
  }

  if (failures.length > 0) {
    console.error('\nBundle budget regression:')
    for (const failure of failures) {
      console.error(`  - ${failure}`)
    }
    process.exit(1)
  }

  console.log('\nBundle budget OK.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
