import { describe, expect, it } from 'vitest'
import { formatMessage, joinListItems, messages, puzzleName } from '../../../src/i18n/messages.ts'
import { parseRichText } from '../../../src/i18n/richText.ts'

describe('formatMessage', () => {
  it('fills every named placeholder', () => {
    expect(formatMessage(messages.puzzles.sampleLabel, { id: 3, name: 'Vừa', blankCount: 40 })).toBe(
      'Đề 3 - Vừa (40 ô trống)',
    )
  })

  it('fails loudly when a value is missing, so a typo in a key cannot slip through', () => {
    expect(() => formatMessage(messages.puzzles.sampleLabel, { id: 3, name: 'Vừa' })).toThrow('blankCount')
  })

  it('leaves braces that are not placeholders alone, such as the set {1, …, 9}', () => {
    expect(formatMessage(messages.algorithm.modellingPoints[1])).toContain('{1, …, 9}')
  })
})

describe('parseRichText', () => {
  it('splits plain, strong and no-wrap parts in order', () => {
    expect(parseRichText('Có <strong>40 ô trống</strong>, đáp án <nowrap>9 8 7</nowrap>.')).toEqual([
      { text: 'Có ', style: 'plain' },
      { text: '40 ô trống', style: 'strong' },
      { text: ', đáp án ', style: 'plain' },
      { text: '9 8 7', style: 'noWrap' },
      { text: '.', style: 'plain' },
    ])
  })

  it('returns a single plain part when there is no markup', () => {
    expect(parseRichText('Đề đã đủ.')).toEqual([{ text: 'Đề đã đủ.', style: 'plain' }])
  })
})

describe('locale helpers', () => {
  it('joins list items with the locale separators', () => {
    expect(joinListItems(['cột 1', 'cột 4', 'cột 6'])).toBe('cột 1, cột 4 và cột 6')
  })

  it('has a name for every sample puzzle', () => {
    for (let puzzleId = 1; puzzleId <= 12; puzzleId++) {
      expect(puzzleName(puzzleId).length).toBeGreaterThan(0)
    }
    expect(() => puzzleName(99)).toThrow()
  })
})
