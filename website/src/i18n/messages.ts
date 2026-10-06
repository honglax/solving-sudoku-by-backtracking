import vietnameseMessages from '../locales/vi.json'

export type Messages = typeof vietnameseMessages

export const messages: Messages = vietnameseMessages
export const LOCALE = messages.meta.locale

export type MessageValues = Record<string, string | number>

const PLACEHOLDER_PATTERN = /\{(\w+)\}/g

export function formatMessage(template: string, values: MessageValues = {}): string {
  return template.replace(PLACEHOLDER_PATTERN, (_placeholder, name: string) => {
    if (!(name in values)) {
      throw new Error(`Missing value "${name}" for message: ${template}`)
    }
    return String(values[name])
  })
}

export function joinListItems(items: string[]): string {
  if (items.length <= 1) {
    return items.join('')
  }
  const allButLast = items.slice(0, -1).join(messages.units.listSeparator)
  return `${allButLast}${messages.units.listLastSeparator}${items[items.length - 1]}`
}

const PUZZLE_NAMES: Record<string, string> = messages.puzzles.names

export function puzzleName(puzzleId: number): string {
  const name = PUZZLE_NAMES[String(puzzleId)]
  if (name === undefined) {
    throw new Error(`No name for puzzle ${puzzleId} in the locale file`)
  }
  return name
}
