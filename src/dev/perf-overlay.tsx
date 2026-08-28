import { useEffect, useMemo, useState } from 'react'

import {
  createLoadGenerator,
  type LoadGeneratorRate,
} from '@/dev/load-generator'
import { PerfHud } from '@/dev/perf-hud'
import {
  DEFAULT_LOAD_SYMBOL_COUNT,
  synthesizeSnapshot,
  synthesizeSymbols,
} from '@/dev/synthetic-symbols'
import { useMarketRuntime } from '@/features/options/hooks/use-market-runtime'
import { createRowRenderCounter } from '@/features/options/lib/render-instrumentation'
import type { RiskComputeMode } from '@/features/options/risk/types'

const LOAD_SYMBOLS = synthesizeSymbols(DEFAULT_LOAD_SYMBOL_COUNT)
const LOAD_SNAPSHOT = synthesizeSnapshot(LOAD_SYMBOLS)

function readInitialRate(): LoadGeneratorRate {
  const value = new URLSearchParams(window.location.search).get('rate')
  if (value === '500' || value === '5000')
    return Number(value) as LoadGeneratorRate
  return 30
}

function readInitialRiskMode(): RiskComputeMode {
  return window.location.search.includes('risk=all') ? 'all' : 'viewport'
}

export function PerfOverlay() {
  const runtime = useMarketRuntime()
  const rowCounter = useMemo(() => createRowRenderCounter(), [])
  const [rowRenders, setRowRenders] = useState(rowCounter.getSnapshot())
  const [rate, setRate] = useState<LoadGeneratorRate>(() => readInitialRate())
  const [riskMode, setRiskMode] = useState<RiskComputeMode>(() =>
    readInitialRiskMode(),
  )
  const [running, setRunning] = useState(false)

  const loadGenerator = useMemo(
    () =>
      createLoadGenerator({
        controller: runtime.controller,
        symbols: LOAD_SYMBOLS,
        ratePerSecond: rate,
      }),
    // Rate updates flow through loadGenerator.setRate() below.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable generator instance
    [runtime.controller],
  )

  useEffect(() => {
    loadGenerator.setRate(rate)
  }, [loadGenerator, rate])

  useEffect(() => {
    runtime.setRiskComputeMode(riskMode)
  }, [riskMode, runtime])

  useEffect(() => {
    runtime.socket.stop()
    runtime.applySnapshot(LOAD_SNAPSHOT)

    return () => {
      loadGenerator.stop()
      rowCounter.dispose()
    }
  }, [loadGenerator, rowCounter, runtime])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setRowRenders(rowCounter.getSnapshot())
    }, 500)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [rowCounter])

  return (
    <PerfHud
      runtime={runtime}
      loadGenerator={loadGenerator}
      rowRenders={rowRenders}
      rate={rate}
      riskMode={riskMode}
      running={running}
      onRateChange={setRate}
      onRiskModeChange={setRiskMode}
      onToggleRunning={() => {
        setRunning((current) => {
          if (current) {
            loadGenerator.stop()
            return false
          }

          loadGenerator.start()
          return true
        })
      }}
    />
  )
}
