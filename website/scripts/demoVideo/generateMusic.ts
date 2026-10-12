import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const AUDIO_DIRECTORY = fileURLToPath(new URL('../../../video/audio/', import.meta.url))
const OUTPUT_PATH = `${AUDIO_DIRECTORY}ambient-bed.wav`
const SAMPLE_RATE = 48000
const CHORD_SECONDS = 8
const PAD_ATTACK_SECONDS = 2.5
const PAD_RELEASE_SECONDS = 3
const PAD_DETUNE_CENTS = 3
const PAD_LOW_PASS_CUTOFF_HERTZ = 1100
const ARPEGGIO_STEP_SECONDS = 0.5
const ARPEGGIO_DECAY_SECONDS = 0.45
const ARPEGGIO_TAIL_DECAYS = 6
const ARPEGGIO_ATTACK_SECONDS = 0.006
const ARPEGGIO_OCTAVE_SHIFT = 24
const ARPEGGIO_LEVEL = 0.1
const ARPEGGIO_CROSS_CHANNEL_LEVEL = 0.4
const ARPEGGIO_PATTERN = [0, 1, 2, 3, 2, 1]
const ECHO_DELAY_SECONDS = 0.375
const ECHO_FEEDBACK = 0.38
const ECHO_MIX = 0.5
const ECHO_PASSES = 2
const PAD_LEVEL = 0.07
const PEAK_LEVEL = 0.6
const MIDI_A4 = 69
const FREQUENCY_A4 = 440
const SEMITONES_PER_OCTAVE = 12
const CENTS_PER_OCTAVE = 1200
const MAXIMUM_SAMPLE = 32767
const BYTES_PER_FRAME = 4
const WAVE_HEADER_BYTES = 44

const CHORDS = [
  [48, 55, 59, 64],
  [45, 52, 55, 60],
  [41, 48, 52, 57],
  [43, 50, 55, 59],
]

function frequencyOf(midiNote: number): number {
  return FREQUENCY_A4 * 2 ** ((midiNote - MIDI_A4) / SEMITONES_PER_OCTAVE)
}

function detuned(frequency: number, cents: number): number {
  return frequency * 2 ** (cents / CENTS_PER_OCTAVE)
}

function softTone(frequency: number, time: number): number {
  const phase = 2 * Math.PI * frequency * time
  return Math.sin(phase) + 0.3 * Math.sin(2 * phase) + 0.1 * Math.sin(3 * phase)
}

function padEnvelope(time: number, length: number): number {
  const attack = Math.min(time / PAD_ATTACK_SECONDS, 1)
  const release = Math.min((length - time) / PAD_RELEASE_SECONDS, 1)
  return Math.max(0, Math.min(attack, release))
}

function renderPad(left: Float32Array, right: Float32Array) {
  const loopSamples = left.length
  const padLength = CHORD_SECONDS + PAD_RELEASE_SECONDS
  const padSamples = padLength * SAMPLE_RATE
  CHORDS.forEach((chord, chordIndex) => {
    const chordStartSample = chordIndex * CHORD_SECONDS * SAMPLE_RATE
    for (let offset = 0; offset < padSamples; offset++) {
      const time = offset / SAMPLE_RATE
      const envelope = padEnvelope(time, padLength)
      let leftSum = 0
      let rightSum = 0
      for (const note of chord) {
        const base = frequencyOf(note)
        leftSum += softTone(detuned(base, PAD_DETUNE_CENTS), time)
        rightSum += softTone(detuned(base, -PAD_DETUNE_CENTS), time)
      }
      const index = (chordStartSample + offset) % loopSamples
      left[index] += leftSum * envelope * PAD_LEVEL
      right[index] += rightSum * envelope * PAD_LEVEL
    }
  })
  const smoothing = 1 - Math.exp((-2 * Math.PI * PAD_LOW_PASS_CUTOFF_HERTZ) / SAMPLE_RATE)
  for (const channel of [left, right]) {
    let state = channel[loopSamples - 1]
    for (let index = 0; index < loopSamples; index++) {
      state += smoothing * (channel[index] - state)
      channel[index] = state
    }
  }
}

function renderArpeggio(loopSeconds: number, loopSamples: number): { left: Float32Array; right: Float32Array } {
  const stepSamples = ARPEGGIO_STEP_SECONDS * SAMPLE_RATE
  const stepCount = Math.round(loopSeconds / ARPEGGIO_STEP_SECONDS)
  const tailSamples = Math.round(ARPEGGIO_DECAY_SECONDS * ARPEGGIO_TAIL_DECAYS * SAMPLE_RATE)
  const echoSamples = Math.round(ECHO_DELAY_SECONDS * SAMPLE_RATE)
  const left = new Float32Array(loopSamples)
  const right = new Float32Array(loopSamples)
  for (let step = 0; step < stepCount; step++) {
    const chord = CHORDS[Math.floor((step * ARPEGGIO_STEP_SECONDS) / CHORD_SECONDS) % CHORDS.length]
    const note = chord[ARPEGGIO_PATTERN[step % ARPEGGIO_PATTERN.length]] + ARPEGGIO_OCTAVE_SHIFT
    const frequency = frequencyOf(note)
    const target = step % 2 === 0 ? left : right
    for (let offset = 0; offset < tailSamples; offset++) {
      const time = offset / SAMPLE_RATE
      const attack = Math.min(time / ARPEGGIO_ATTACK_SECONDS, 1)
      const value = softTone(frequency, time) * attack * Math.exp(-time / ARPEGGIO_DECAY_SECONDS) * ARPEGGIO_LEVEL
      target[(step * stepSamples + offset) % loopSamples] += value
    }
  }
  for (const channel of [left, right]) {
    for (let pass = 0; pass < ECHO_PASSES; pass++) {
      for (let index = 0; index < loopSamples; index++) {
        channel[(index + echoSamples) % loopSamples] += channel[index] * ECHO_FEEDBACK * ECHO_MIX
      }
    }
  }
  return { left, right }
}

function renderLoop(): { left: Float32Array; right: Float32Array } {
  const loopSeconds = CHORDS.length * CHORD_SECONDS
  const loopSamples = loopSeconds * SAMPLE_RATE
  const left = new Float32Array(loopSamples)
  const right = new Float32Array(loopSamples)
  renderPad(left, right)
  const arpeggio = renderArpeggio(loopSeconds, loopSamples)
  let peak = 0
  for (let index = 0; index < loopSamples; index++) {
    left[index] += arpeggio.left[index] + arpeggio.right[index] * ARPEGGIO_CROSS_CHANNEL_LEVEL
    right[index] += arpeggio.right[index] + arpeggio.left[index] * ARPEGGIO_CROSS_CHANNEL_LEVEL
    peak = Math.max(peak, Math.abs(left[index]), Math.abs(right[index]))
  }
  const gain = PEAK_LEVEL / peak
  for (let index = 0; index < loopSamples; index++) {
    left[index] *= gain
    right[index] *= gain
  }
  return { left, right }
}

function writeWave(left: Float32Array, right: Float32Array, totalSeconds: number) {
  const totalSamples = Math.ceil(totalSeconds * SAMPLE_RATE)
  const dataBytes = totalSamples * BYTES_PER_FRAME
  const buffer = Buffer.alloc(WAVE_HEADER_BYTES + dataBytes)
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(WAVE_HEADER_BYTES - 8 + dataBytes, 4)
  buffer.write('WAVEfmt ', 8)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(2, 22)
  buffer.writeUInt32LE(SAMPLE_RATE, 24)
  buffer.writeUInt32LE(SAMPLE_RATE * BYTES_PER_FRAME, 28)
  buffer.writeUInt16LE(BYTES_PER_FRAME, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataBytes, 40)
  for (let index = 0; index < totalSamples; index++) {
    const source = index % left.length
    buffer.writeInt16LE(Math.round(left[source] * MAXIMUM_SAMPLE), WAVE_HEADER_BYTES + index * BYTES_PER_FRAME)
    buffer.writeInt16LE(Math.round(right[source] * MAXIMUM_SAMPLE), WAVE_HEADER_BYTES + index * BYTES_PER_FRAME + 2)
  }
  mkdirSync(AUDIO_DIRECTORY, { recursive: true })
  writeFileSync(OUTPUT_PATH, buffer)
}

const requestedSeconds = Number(process.argv[2] ?? CHORDS.length * CHORD_SECONDS)
const loop = renderLoop()
writeWave(loop.left, loop.right, requestedSeconds)
console.log(`-> ${OUTPUT_PATH} (${requestedSeconds} s)`)
