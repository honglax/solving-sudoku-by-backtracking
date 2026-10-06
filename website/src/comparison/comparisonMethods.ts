import type { CellOrder } from '../solver/backtrackingSolver.ts'
import type { ComparisonMethod } from './comparisonSolver.ts'
import type { CheckStrategyId } from './usageTrackers.ts'

export type ComparisonMethodId = `${CellOrder}:${CheckStrategyId}`

export type ListedComparisonMethod = ComparisonMethod & { id: ComparisonMethodId }

export const CELL_ORDERS: CellOrder[] = ['rowMajor', 'fewestCandidates']
export const CHECK_STRATEGIES: CheckStrategyId[] = ['gridScan', 'usageFlags', 'bitmask']

export const COMPARISON_METHODS: ListedComparisonMethod[] = CELL_ORDERS.flatMap(cellOrder =>
  CHECK_STRATEGIES.map(checkStrategy => ({
    id: `${cellOrder}:${checkStrategy}` as const,
    cellOrder,
    checkStrategy,
  })),
)
