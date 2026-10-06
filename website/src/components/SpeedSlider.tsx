import { useId } from 'react'
import { formatMessage, messages } from '../i18n/messages.ts'
import { formatCount } from '../solverView/formatting.ts'
import {
  SPEED_SLIDER_MAXIMUM,
  SPEED_SLIDER_MINIMUM,
  sliderPositionToSpeed,
  speedToSliderPosition,
} from '../solverView/speed.ts'
import '../styles/components/SpeedSlider.css'

const SPEED = messages.solver.controls

type SpeedSliderProps = {
  triesPerSecond: number
  onChangeSpeed: (triesPerSecond: number) => void
}

export function SpeedSlider({ triesPerSecond, onChangeSpeed }: SpeedSliderProps) {
  const sliderId = useId()
  const speedLabel = formatMessage(SPEED.speedValue, { speed: formatCount(triesPerSecond) })
  return (
    <div className="speed-slider">
      <label className="speed-slider__label" htmlFor={sliderId}>
        {SPEED.speedLabel}
      </label>
      <input
        id={sliderId}
        className="speed-slider__input"
        type="range"
        min={SPEED_SLIDER_MINIMUM}
        max={SPEED_SLIDER_MAXIMUM}
        value={speedToSliderPosition(triesPerSecond)}
        aria-valuetext={speedLabel}
        onChange={event => onChangeSpeed(sliderPositionToSpeed(Number(event.target.value)))}
      />
      <output className="speed-slider__value" htmlFor={sliderId}>
        {speedLabel}
      </output>
    </div>
  )
}
