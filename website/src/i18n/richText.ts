export type RichTextStyle = 'plain' | 'strong' | 'noWrap'

export type RichTextSegment = {
  text: string
  style: RichTextStyle
}

const TAG_STYLES: Record<string, RichTextStyle> = {
  strong: 'strong',
  nowrap: 'noWrap',
}

const TAG_PATTERN = /<(strong|nowrap)>(.*?)<\/\1>/g

export function parseRichText(text: string): RichTextSegment[] {
  const segments: RichTextSegment[] = []
  let plainTextStart = 0
  for (const match of text.matchAll(TAG_PATTERN)) {
    const matchStart = match.index
    if (matchStart > plainTextStart) {
      segments.push({ text: text.slice(plainTextStart, matchStart), style: 'plain' })
    }
    segments.push({ text: match[2], style: TAG_STYLES[match[1]] })
    plainTextStart = matchStart + match[0].length
  }
  if (plainTextStart < text.length) {
    segments.push({ text: text.slice(plainTextStart), style: 'plain' })
  }
  return segments
}
