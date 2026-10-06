export const MINIMUM_TRIES_PER_SECOND = 1
export const MAXIMUM_TRIES_PER_SECOND = 1000
export const DEFAULT_TRIES_PER_SECOND = 20

export const SPEED_SLIDER_STEPS_PER_DECADE = 100
export const SPEED_SLIDER_MINIMUM = 0
export const SPEED_SLIDER_MAXIMUM = Math.round(Math.log10(MAXIMUM_TRIES_PER_SECOND) * SPEED_SLIDER_STEPS_PER_DECADE)

export function sliderPositionToSpeed(position: number): number {
  const speed = Math.round(10 ** (position / SPEED_SLIDER_STEPS_PER_DECADE))
  return Math.min(MAXIMUM_TRIES_PER_SECOND, Math.max(MINIMUM_TRIES_PER_SECOND, speed))
}

export function speedToSliderPosition(speed: number): number {
  return Math.round(Math.log10(speed) * SPEED_SLIDER_STEPS_PER_DECADE)
}
