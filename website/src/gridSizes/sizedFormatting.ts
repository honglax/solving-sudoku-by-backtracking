export function boundDigitCount(size: number, blankCount: number): number {
  return (BigInt(size) ** BigInt(blankCount)).toString().length
}
