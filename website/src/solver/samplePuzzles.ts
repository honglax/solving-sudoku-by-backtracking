export type MeasuredCounts = {
  tryCount: number
  recordCount: number
  restoreCount: number
}

export type MeasuredFullSearch = MeasuredCounts & {
  solutionCount: number
}

export type PuzzleSource = { kind: 'sample'; sampleId: number } | { kind: 'custom' }

export type SamplePuzzle = {
  id: number
  puzzle: string
  measured: MeasuredCounts
  measuredWithFewestCandidatesFirst: MeasuredCounts
  measuredFullSearch: MeasuredFullSearch | null
  isListed: boolean
}

export const SAMPLE_PUZZLES: SamplePuzzle[] = [
  {
    id: 1,
    puzzle: '5816724397928436513645917824389572.6256184973179326845845219367913768524627435198',
    isListed: true,
    measured: { tryCount: 1, recordCount: 1, restoreCount: 0 },
    measuredWithFewestCandidatesFirst: { tryCount: 1, recordCount: 1, restoreCount: 0 },
    measuredFullSearch: { solutionCount: 1, tryCount: 9, recordCount: 1, restoreCount: 1 },
  },
  {
    id: 2,
    puzzle: '.816724397928436513645917824389572.62561.4973179326845845219367913768.2462743519.',
    isListed: true,
    measured: { tryCount: 27, recordCount: 5, restoreCount: 0 },
    measuredWithFewestCandidatesFirst: { tryCount: 27, recordCount: 5, restoreCount: 0 },
    measuredFullSearch: { solutionCount: 1, tryCount: 45, recordCount: 5, restoreCount: 5 },
  },
  {
    id: 3,
    puzzle: '5346..912....9534.19...2.6....761.2...6..37...1.9248....1....842..41.635.4.2.617.',
    isListed: true,
    measured: { tryCount: 1909, recordCount: 227, restoreCount: 187 },
    measuredWithFewestCandidatesFirst: { tryCount: 226, recordCount: 40, restoreCount: 0 },
    measuredFullSearch: { solutionCount: 4, tryCount: 11673, recordCount: 1300, restoreCount: 1300 },
  },
  {
    id: 4,
    puzzle: '53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79',
    isListed: true,
    measured: { tryCount: 37652, recordCount: 4208, restoreCount: 4157 },
    measuredWithFewestCandidatesFirst: { tryCount: 239, recordCount: 51, restoreCount: 0 },
    measuredFullSearch: { solutionCount: 1, tryCount: 41679, recordCount: 4631, restoreCount: 4631 },
  },
  {
    id: 5,
    puzzle: '8..........36......7..9.2...5...7.......457.....1...3...1....68..85...1..9....4..',
    isListed: true,
    measured: { tryCount: 445778, recordCount: 49558, restoreCount: 49498 },
    measuredWithFewestCandidatesFirst: { tryCount: 90665, recordCount: 10101, restoreCount: 10041 },
    measuredFullSearch: { solutionCount: 1, tryCount: 18619020, recordCount: 2068780, restoreCount: 2068780 },
  },
  {
    id: 6,
    puzzle: '.................................................................................',
    isListed: true,
    measured: { tryCount: 3195, recordCount: 391, restoreCount: 310 },
    measuredWithFewestCandidatesFirst: { tryCount: 405, recordCount: 81, restoreCount: 0 },
    measuredFullSearch: null,
  },
  {
    id: 7,
    puzzle: '.234567891.......................................................................',
    isListed: true,
    measured: { tryCount: 9, recordCount: 0, restoreCount: 0 },
    measuredWithFewestCandidatesFirst: { tryCount: 9, recordCount: 0, restoreCount: 0 },
    measuredFullSearch: { solutionCount: 0, tryCount: 9, recordCount: 0, restoreCount: 0 },
  },
  {
    id: 8,
    puzzle: '53.6..912....9534.19...2.6....761.2...6..37...1.92.8....1....84...41..35.4.2.617.',
    isListed: true,
    measured: { tryCount: 827, recordCount: 109, restoreCount: 65 },
    measuredWithFewestCandidatesFirst: { tryCount: 242, recordCount: 44, restoreCount: 0 },
    measuredFullSearch: { solutionCount: 18, tryCount: 43317, recordCount: 4830, restoreCount: 4830 },
  },
  {
    id: 9,
    puzzle: '5346..912....9534.19..32.6....761.2...6..37...1.9248....1....842..41.635.4.2.617.',
    isListed: true,
    measured: { tryCount: 981, recordCount: 108, restoreCount: 108 },
    measuredWithFewestCandidatesFirst: { tryCount: 27, recordCount: 2, restoreCount: 2 },
    measuredFullSearch: { solutionCount: 0, tryCount: 981, recordCount: 108, restoreCount: 108 },
  },
  {
    id: 10,
    puzzle: '1....7.9..3..2...8..96..5....53..9...1..8...26....4...3......1..4......7..7...3..',
    isListed: true,
    measured: { tryCount: 80491, recordCount: 8969, restoreCount: 8911 },
    measuredWithFewestCandidatesFirst: { tryCount: 1723, recordCount: 217, restoreCount: 159 },
    measuredFullSearch: { solutionCount: 1, tryCount: 169956, recordCount: 18884, restoreCount: 18884 },
  },
  {
    id: 11,
    puzzle: '1.......2.9.4...5...6...7...5.9.3.......7.......85..4.7.....6...3...9.8...2.....1',
    isListed: true,
    measured: { tryCount: 2357880, recordCount: 262014, restoreCount: 261954 },
    measuredWithFewestCandidatesFirst: { tryCount: 42081, recordCount: 4703, restoreCount: 4643 },
    measuredFullSearch: { solutionCount: 1, tryCount: 6410259, recordCount: 712251, restoreCount: 712251 },
  },
  {
    id: 12,
    puzzle: '..............3.85..1.2.......5.7.....4...1...9.......5......73..2.1........4...9',
    isListed: false,
    measured: { tryCount: 622577597, recordCount: 69175316, restoreCount: 69175252 },
    measuredWithFewestCandidatesFirst: { tryCount: 407156, recordCount: 45267, restoreCount: 45203 },
    measuredFullSearch: null,
  },
]

export const DEFAULT_SAMPLE_PUZZLE_ID = 3
export const ANTI_BACKTRACKING_PUZZLE_ID = 12

export const LISTED_SAMPLE_PUZZLES = SAMPLE_PUZZLES.filter(sample => sample.isListed)

export function findSamplePuzzle(sampleId: number): SamplePuzzle {
  const sample = SAMPLE_PUZZLES.find(candidate => candidate.id === sampleId)
  if (sample === undefined) {
    throw new Error(`Unknown sample puzzle ${sampleId}`)
  }
  return sample
}
