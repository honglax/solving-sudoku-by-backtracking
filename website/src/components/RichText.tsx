import { parseRichText } from '../i18n/richText.ts'

type RichTextProps = {
  text: string
  strongClassName?: string
}

export function RichText({ text, strongClassName }: RichTextProps) {
  return (
    <>
      {parseRichText(text).map((segment, segmentIndex) => {
        if (segment.style === 'strong') {
          return (
            <strong key={segmentIndex} className={strongClassName}>
              {segment.text}
            </strong>
          )
        }
        if (segment.style === 'noWrap') {
          return (
            <span key={segmentIndex} className="no-wrap">
              {segment.text}
            </span>
          )
        }
        return <span key={segmentIndex}>{segment.text}</span>
      })}
    </>
  )
}
