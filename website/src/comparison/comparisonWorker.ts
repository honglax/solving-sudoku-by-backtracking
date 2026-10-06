import { COMPARISON_METHODS } from './comparisonMethods.ts'
import { measureMethod, type MeasurementMessage, type MeasurementRequest } from './comparisonMeasurement.ts'

function postMeasurementMessage(message: MeasurementMessage) {
  self.postMessage(message)
}

function readClock(): number {
  return performance.now()
}

self.onmessage = (event: MessageEvent<MeasurementRequest>) => {
  const { puzzle, methodIds } = event.data
  for (const methodId of methodIds) {
    const method = COMPARISON_METHODS.find(candidate => candidate.id === methodId)
    if (method === undefined) {
      throw new Error(`Unknown comparison method ${methodId}`)
    }
    postMeasurementMessage({ kind: 'methodStarted', methodId })
    postMeasurementMessage({ kind: 'methodMeasured', methodId, measurement: measureMethod(puzzle, method, readClock) })
  }
  postMeasurementMessage({ kind: 'allMeasured' })
}
