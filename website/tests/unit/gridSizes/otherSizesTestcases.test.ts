import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parseSizedPuzzle, sizedGridToString } from '../../../src/gridSizes/sizedPuzzleParser.ts'
import { applySizedEvent, createSizedProgress } from '../../../src/gridSizes/sizedProgress.ts'
import { shapeOf } from '../../../src/gridSizes/sizedRules.ts'
import { solveSizedBacktracking } from '../../../src/gridSizes/sizedSolver.ts'

const FILE_PATH = fileURLToPath(new URL('../../../../testcases/other-sizes/other-sizes.txt', import.meta.url))
const BLOCK_SEPARATOR = /^=== /m
const EXPECTED_MARKER = '--- expected'
const INPUT_MARKER = '--- input'

type TestcaseBlock = {
  id: string
  size: number
  inputLines: string[]
  expectedLines: string[]
}

function readBlocks(): TestcaseBlock[] {
  return readFileSync(FILE_PATH, 'utf-8')
    .split(BLOCK_SEPARATOR)
    .filter(text => text.trim() !== '')
    .map(text => {
      const lines = text.trimEnd().split('\n')
      const [id, sizeText] = lines[0].split(' · ')
      const inputStart = lines.indexOf(INPUT_MARKER)
      const expectedStart = lines.indexOf(EXPECTED_MARKER)
      return {
        id,
        size: Number(sizeText.split('x')[0]),
        inputLines: lines.slice(inputStart + 1, expectedStart),
        expectedLines: lines.slice(expectedStart + 1),
      }
    })
}

function expectedValue(block: TestcaseBlock, key: string): string {
  const line = block.expectedLines.find(candidate => candidate.startsWith(`${key} `))
  if (line === undefined) {
    throw new Error(`${block.id} has no "${key}" line`)
  }
  return line.slice(key.length + 1)
}

describe('the testcase file for other grid sizes', () => {
  const blocks = readBlocks()

  it('lists 4x4, 9x9 and 16x16 cases', () => {
    expect(new Set(blocks.map(block => block.size))).toEqual(new Set([4, 9, 16]))
    expect(blocks).toHaveLength(11)
  })

  for (const block of blocks) {
    it(`${block.id} (${block.size}x${block.size}) matches the solver`, () => {
      const shape = shapeOf(Math.sqrt(block.size))
      const parseResult = parseSizedPuzzle(block.inputLines.join(''), shape)
      if (!parseResult.ok) {
        throw new Error(`${block.id} does not parse`)
      }
      const progress = createSizedProgress(parseResult.grid)
      for (const event of solveSizedBacktracking(shape, parseResult.grid)) {
        applySizedEvent(shape, progress, event)
      }
      expect(progress.outcome === 'solved' ? 'SOLVED' : 'NO SOLUTION').toBe(expectedValue(block, 'result'))
      expect(progress.tryCount).toBe(Number(expectedValue(block, 'tries')))
      expect(progress.recordCount).toBe(Number(expectedValue(block, 'records')))
      expect(progress.restoreCount).toBe(Number(expectedValue(block, 'restores')))
      if (progress.outcome === 'solved') {
        const solutionLines = block.expectedLines.slice(-block.size)
        expect(sizedGridToString(progress.grid)).toBe(solutionLines.join(''))
      }
    })
  }
})
