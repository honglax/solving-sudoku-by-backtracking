import { useEffect, useRef, useState } from 'react'
import { COMPARISON_METHODS, type ComparisonMethodId } from '../comparison/comparisonMethods.ts'
import type { MeasurementMessage, MeasurementRequest, MethodMeasurement } from '../comparison/comparisonMeasurement.ts'
import type { Grid } from '../solver/sudokuRules.ts'

export type MeasurementStatus = 'idle' | 'measuring' | 'finished' | 'stopped'

export type MeasurementsByMethod = Partial<Record<ComparisonMethodId, MethodMeasurement>>

function createComparisonWorker(): Worker {
  return new Worker(new URL('../comparison/comparisonWorker.ts', import.meta.url), { type: 'module' })
}

export function useComparisonMeasurement() {
  const [status, setStatus] = useState<MeasurementStatus>('idle')
  const [measurements, setMeasurements] = useState<MeasurementsByMethod>({})
  const [currentMethodId, setCurrentMethodId] = useState<ComparisonMethodId | null>(null)
  const workerRef = useRef<Worker | null>(null)

  const terminateWorker = () => {
    workerRef.current?.terminate()
    workerRef.current = null
  }

  useEffect(() => terminateWorker, [])

  const handleMessage = (message: MeasurementMessage) => {
    if (message.kind === 'methodStarted') {
      setCurrentMethodId(message.methodId)
    } else if (message.kind === 'methodMeasured') {
      setMeasurements(previous => ({ ...previous, [message.methodId]: message.measurement }))
    } else {
      setCurrentMethodId(null)
      setStatus('finished')
      terminateWorker()
    }
  }

  const start = (puzzle: Grid) => {
    terminateWorker()
    const worker = createComparisonWorker()
    workerRef.current = worker
    worker.onmessage = (event: MessageEvent<MeasurementMessage>) => handleMessage(event.data)
    const methodIds = COMPARISON_METHODS.map(method => method.id)
    setMeasurements({})
    setCurrentMethodId(methodIds[0])
    setStatus('measuring')
    const request: MeasurementRequest = { puzzle, methodIds }
    worker.postMessage(request)
  }

  const stop = () => {
    terminateWorker()
    setCurrentMethodId(null)
    setStatus('stopped')
  }

  const reset = () => {
    terminateWorker()
    setMeasurements({})
    setCurrentMethodId(null)
    setStatus('idle')
  }

  return { status, measurements, currentMethodId, start, stop, reset }
}
