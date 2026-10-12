export type SizedMeasuredCounts = {
  tryCount: number
  recordCount: number
  restoreCount: number
}

export type SizedSamplePuzzle = {
  id: number
  boxSize: number
  puzzle: string
  solutionCount: number
  measured: SizedMeasuredCounts
}

export const SIZED_SAMPLE_PUZZLES: SizedSamplePuzzle[] = [
  {
    id: 1,
    boxSize: 2,
    puzzle:
      '..4.34.14.3.2314',
    solutionCount: 1,
    measured: { tryCount: 11, recordCount: 6, restoreCount: 0 },
  },
  {
    id: 2,
    boxSize: 2,
    puzzle:
      '.1..3.4..41..3..',
    solutionCount: 1,
    measured: { tryCount: 52, recordCount: 17, restoreCount: 7 },
  },
  {
    id: 3,
    boxSize: 2,
    puzzle:
      '4.2......4.2....',
    solutionCount: 10,
    measured: { tryCount: 28, recordCount: 12, restoreCount: 0 },
  },
  {
    id: 4,
    boxSize: 2,
    puzzle:
      '43...2.....4.1.3',
    solutionCount: 0,
    measured: { tryCount: 44, recordCount: 10, restoreCount: 10 },
  },
  {
    id: 5,
    boxSize: 2,
    puzzle:
      '................',
    solutionCount: 288,
    measured: { tryCount: 40, recordCount: 16, restoreCount: 0 },
  },
  {
    id: 6,
    boxSize: 3,
    puzzle:
      '53467.9..67..95348.9834.5678.976..234.6.537917139.48569615372.4287419635.45.86179',
    solutionCount: 1,
    measured: { tryCount: 79, recordCount: 19, restoreCount: 3 },
  },
  {
    id: 7,
    boxSize: 3,
    puzzle:
      '5346..912....9534.19...2.6....761.2...6..37...1.9248....1....842..41.635.4.2.617.',
    solutionCount: 4,
    measured: { tryCount: 1909, recordCount: 227, restoreCount: 187 },
  },
  {
    id: 8,
    boxSize: 4,
    puzzle:
      '7.9GA.2CFD3B5614.465B3DFEG.92A8C8CA297GE.516DB3...BD6154C28AG97EA248F9.G5.6...BD.GF74A82D3BC1E.5BDC..61..8A.7F9G65E1CB3DG79F84A2C32BGE618A459DF7485ADF9716.GB2C3F7D954A..BC26GE1.1G62.B379...548D93F154AB.28E.G.5A143DF96.G7C82B2.8C7GE.A.51.3D9G..E8.CB9FD3415.',
    solutionCount: 1,
    measured: { tryCount: 352, recordCount: 41, restoreCount: 1 },
  },
  {
    id: 9,
    boxSize: 4,
    puzzle:
      'G.5E..D.7..6C.13.46.G.F53.C1AD89..8A3C2..FE5..6..21.7B46.DA8EF5G46E.FG5A2.3B9..DF5AG.98C.6.E31.2.1.3476ED.9CG5..D..9.3.B...A76E4..3.12.7..F9.EG..E.4...91B27.C385A9....36E4G2B..1B.26.EG8.D3.A95EGF6A59DB7148.2CA9D5C832E.6F174.C328B174A95D6.FE.741E6GFC38259DA',
    solutionCount: 1,
    measured: { tryCount: 1111, recordCount: 100, restoreCount: 30 },
  },
  {
    id: 10,
    boxSize: 4,
    puzzle:
      '.7..6.5.3F289.G1823F.1.46A.CDB..C....E.B94G.3.281.9438..DB7.6A5C.BE2C9AG.5F61....F85..47CGA.E.B3.ACGE.B...4D.5.6D..7..F5.2.3CGA.BE735AC926.FGD...1G.2F.673EB59.A.826G41..9...3E..C.9..E.GD14...F.9.1...84E.7F.6....8.G91..65.E.75...4..E.1.G.8..7D.EF5..B8.2A1..',
    solutionCount: 9,
    measured: { tryCount: 26006, recordCount: 1673, restoreCount: 1573 },
  },
  {
    id: 11,
    boxSize: 4,
    puzzle:
      'D28.E.7...3...1A..5EAF6.D4.8.CGB..FA.C.G.E7.28..G3...8.D.A...59EE52D..F.4G8.C.....61.384.9F.52......D25.B.C6.7A9A.7.1..BE..2834G....F..6.8.D4..C2ED8..A7.C..B1.F6...C...75A9E.28.4.C8.......A9.58.4.2.9.........F1A7.....2..D..359E...1F83D4GB..CG.6...8F7.A9E52',
    solutionCount: 36,
    measured: { tryCount: 406824, recordCount: 25484, restoreCount: 25364 },
  },
]

export function findSizedSamplePuzzle(id: number): SizedSamplePuzzle {
  const sample = SIZED_SAMPLE_PUZZLES.find(candidate => candidate.id === id)
  if (sample === undefined) {
    throw new Error(`No sized sample puzzle with id ${id}`)
  }
  return sample
}

export function sizedSamplesOfBoxSize(boxSize: number): SizedSamplePuzzle[] {
  return SIZED_SAMPLE_PUZZLES.filter(sample => sample.boxSize === boxSize)
}
