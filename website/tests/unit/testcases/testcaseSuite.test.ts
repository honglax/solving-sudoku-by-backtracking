import { describe, expect, it } from 'vitest'
import { findMissingCoverage, readManifest, verifyCase, type CaseVerdict } from '../../../../testcases/tools/testcaseRunner.ts'

const casesQuickEnoughForUnitTests = readManifest().filter(entry => !entry.isSlow)
const verdicts: CaseVerdict[] = []

describe('testcase suite', () => {
  for (const entry of casesQuickEnoughForUnitTests) {
    it(`${entry.id}: ${entry.description}`, () => {
      const verdict = verifyCase(entry)
      verdicts.push(verdict)
      expect(verdict.mismatches).toEqual([])
    })
  }

  it('reaches every tracked behaviour of the parser, validator and solver', () => {
    expect(verdicts).toHaveLength(casesQuickEnoughForUnitTests.length)
    expect(findMissingCoverage(verdicts)).toEqual([])
  })
})
