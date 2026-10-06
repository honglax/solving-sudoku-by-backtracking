import { CircleCheck, CircleDot, CircleX, Hourglass, Info, TriangleAlert, Undo2, type LucideIcon } from 'lucide-react'
import type { MessageTone } from '../../solverView/statusMessage.ts'

export const TONE_ICONS: Record<MessageTone, LucideIcon> = {
  info: Info,
  busy: Hourglass,
  trying: CircleDot,
  rejected: CircleX,
  restored: Undo2,
  solved: CircleCheck,
  error: TriangleAlert,
}
