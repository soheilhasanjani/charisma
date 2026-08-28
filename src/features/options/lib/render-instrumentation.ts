type RowRenderRecorder = (symbol: string) => void

let recorder: RowRenderRecorder | null = null

export function setRowRenderRecorder(next: RowRenderRecorder | null) {
  recorder = next
}

export function recordRowRender(symbol: string) {
  recorder?.(symbol)
}

export function createRowRenderCounter() {
  const counts = new Map<string, number>()
  let total = 0

  setRowRenderRecorder((symbol) => {
    total += 1
    counts.set(symbol, (counts.get(symbol) ?? 0) + 1)
  })

  return {
    getSnapshot() {
      let peakSymbol = ''
      let peakCount = 0

      for (const [symbol, count] of counts) {
        if (count > peakCount) {
          peakSymbol = symbol
          peakCount = count
        }
      }

      return {
        total,
        uniqueRows: counts.size,
        peakSymbol,
        peakCount,
      }
    },
    reset() {
      counts.clear()
      total = 0
    },
    dispose() {
      setRowRenderRecorder(null)
    },
  }
}
