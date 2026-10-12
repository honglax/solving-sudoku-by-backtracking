const THOUSAND = 1000
const DIGIT_WORDS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín']
const GROUP_NAMES = ['', 'nghìn', 'triệu', 'tỉ']

const SYMBOL_REPLACEMENTS: Array<[RegExp, string]> = [
  [/9⁶⁰/g, 'chín mũ sáu mươi'],
  [/9⁶⁴/g, 'chín mũ sáu mươi bốn'],
  [/Bảng S/g, 'Bảng ét'],
  [/S₁ đến Sₙ/g, 'ét một đến ét n'],
  [/(\d)×(\d)/g, '$1 nhân $2'],
  [/\((\d), (\d)\)/g, 'hàng $1, cột $2'],
]

function readUnderThousand(value: number, isInnerGroup: boolean): string {
  const hundreds = Math.floor(value / 100)
  const remainder = value % 100
  const tens = Math.floor(remainder / 10)
  const units = remainder % 10
  const words: string[] = []
  if (hundreds > 0 || isInnerGroup) {
    words.push(`${DIGIT_WORDS[hundreds]} trăm`)
  }
  if (tens > 1) {
    words.push(`${DIGIT_WORDS[tens]} mươi`)
    if (units === 1) {
      words.push('mốt')
    } else if (units === 5) {
      words.push('lăm')
    } else if (units > 0) {
      words.push(DIGIT_WORDS[units])
    }
  } else if (tens === 1) {
    words.push('mười')
    if (units === 5) {
      words.push('lăm')
    } else if (units > 0) {
      words.push(DIGIT_WORDS[units])
    }
  } else if (units > 0) {
    if (hundreds > 0 || isInnerGroup) {
      words.push('linh')
    }
    words.push(DIGIT_WORDS[units])
  }
  return words.join(' ')
}

export function numberToVietnamese(value: number): string {
  if (value === 0) {
    return DIGIT_WORDS[0]
  }
  const groups: number[] = []
  let remaining = value
  while (remaining > 0) {
    groups.push(remaining % THOUSAND)
    remaining = Math.floor(remaining / THOUSAND)
  }
  const words: string[] = []
  for (let index = groups.length - 1; index >= 0; index--) {
    const group = groups[index]
    if (group === 0) {
      continue
    }
    const isInnerGroup = index < groups.length - 1
    words.push(readUnderThousand(group, isInnerGroup))
    if (GROUP_NAMES[index] !== '') {
      words.push(GROUP_NAMES[index])
    }
  }
  return words.join(' ')
}

export function toSpokenVietnamese(text: string): string {
  let spoken = text
  for (const [pattern, replacement] of SYMBOL_REPLACEMENTS) {
    spoken = spoken.replace(pattern, replacement)
  }
  spoken = spoken.replace(/(\d+),(\d+)/g, (_match, whole: string, fraction: string) => {
    const fractionWords = [...fraction].map(digit => DIGIT_WORDS[Number(digit)]).join(' ')
    return `${numberToVietnamese(Number(whole))} phẩy ${fractionWords}`
  })
  spoken = spoken.replace(/\d{1,3}(?:\.\d{3})+/g, match => String(Number(match.replaceAll('.', ''))))
  spoken = spoken.replace(/\d+/g, match => numberToVietnamese(Number(match)))
  return spoken
}
