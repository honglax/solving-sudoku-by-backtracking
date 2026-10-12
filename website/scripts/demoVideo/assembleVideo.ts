import { chromium } from '@playwright/test'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { FRAME_HEIGHT, FRAME_WIDTH, type CaptionLine } from './demoStage.ts'
import { toSpokenVietnamese } from './spokenText.ts'

const VIDEO_DIRECTORY = fileURLToPath(new URL('../../../video/', import.meta.url))
const SEGMENTS_DIRECTORY = `${VIDEO_DIRECTORY}segments/`
const WORK_DIRECTORY = `${VIDEO_DIRECTORY}work/`
const AUDIO_DIRECTORY = `${VIDEO_DIRECTORY}audio/`
const MOTION_DIRECTORY = `${VIDEO_DIRECTORY}motion/`
const GENERATED_MUSIC_PATH = `${AUDIO_DIRECTORY}ambient-bed.wav`
const MUSIC_GENERATOR_PATH = fileURLToPath(new URL('./generateMusic.ts', import.meta.url))
const OUTPUT_PATH = `${VIDEO_DIRECTORY}sudoku-backtracking-demo.mp4`
const NARRATION_SCRIPT_PATH = `${VIDEO_DIRECTORY}narration-script.md`
const PLAIN_OUTPUT_PATH = `${VIDEO_DIRECTORY}sudoku-backtracking-demo-plain.mp4`
const PLAIN_NARRATION_SCRIPT_PATH = `${VIDEO_DIRECTORY}narration-script-plain.md`
const PLAIN_FLAG = '--plain'
const FRAMES_PER_SECOND = 25
const CARD_SECONDS = 4
const CONSTANT_RATE_FACTOR = '20'
const AUDIO_BITRATE = '192k'
const AUDIO_SAMPLE_RATE = '48000'
const BACKGROUND_COLOR = '0x0f172a'
const MUSIC_FADE_IN_SECONDS = 3
const MUSIC_FADE_OUT_SECONDS = 6
const MUSIC_LOUDNESS_ALONE = '-22'
const MUSIC_LOUDNESS_UNDER_VOICE = '-32'
const VOICE_LOUDNESS = '-16'
const SECONDS_PER_MINUTE = 60
const CARD_SPEECH_START_SECONDS = 0.5

const TITLE = 'Thuật toán quay lui giải Sudoku như thế nào?'
const AUTHOR_LINE = 'Lã Xuân Hồng · MSSV 25410056'
const INTRO_SUBTITLE = 'Video demo bài tập lớn · Phân tích và Thiết kế thuật toán'
const OUTRO_TITLE = 'Cảm ơn đã xem'
const OUTRO_LINES = ['Website: solving-sudoku-by-backtracking.vercel.app', 'Mã nguồn: github.com/honglax/solving-sudoku-by-backtracking']
const INTRO_SPEECH = 'Thuật toán quay lui giải Sudoku như thế nào? Video demo bài tập lớn của Lã Xuân Hồng.'
const OUTRO_SPEECH = 'Cảm ơn bạn đã xem.'

type OutputSize = { width: number; height: number }
type Options = { intro?: string; outro?: string; music?: string; musicCredit?: string; voice?: string; isPlain: boolean }
type ScriptEntry = { startSeconds: number; text: string }

function parseOptions(): Options {
  const options: Options = { isPlain: process.argv.includes(PLAIN_FLAG) }
  for (const argument of process.argv.slice(2)) {
    const [name, ...valueParts] = argument.split('=')
    const value = valueParts.join('=')
    if (name === '--intro') {
      options.intro = value
    } else if (name === '--outro') {
      options.outro = value
    } else if (name === '--music') {
      options.music = value
    } else if (name === '--music-credit') {
      options.musicCredit = value
    } else if (name === '--voice') {
      options.voice = value
    }
  }
  return options
}

const MOTION_EXTENSIONS = ['mp4', 'webm', 'mov']

function findMotionClip(name: string): string | undefined {
  return MOTION_EXTENSIONS.map(extension => `${MOTION_DIRECTORY}${name}.${extension}`).find(path => existsSync(path))
}

function runFfmpeg(args: string[]) {
  const result = spawnSync('ffmpeg', ['-v', 'error', '-y', ...args], { encoding: 'utf-8' })
  if (result.status !== 0) {
    throw new Error(`ffmpeg failed: ${result.stderr}`)
  }
}

function probeDuration(path: string): number {
  const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path], { encoding: 'utf-8' })
  return Number(probe.stdout.trim())
}

function readSegmentSize(segmentPath: string): OutputSize {
  const probe = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', segmentPath], { encoding: 'utf-8' })
  const [width, height] = probe.stdout.trim().split(',').map(Number)
  return { width, height }
}

function overlayHtml(heading: string, lines: string[], isOpaque: boolean): string {
  const background = isOpaque ? 'background:#0f172a;' : 'background:transparent;'
  const placement = isOpaque ? 'justify-content:center;' : 'justify-content:flex-end;padding-bottom:56px;'
  const body = lines.map(line => `<p class="line">${line}</p>`).join('')
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;${background}font-family:system-ui,-apple-system,"Helvetica Neue",Arial,sans-serif;color:#f8fafc}
    #frame{width:${FRAME_WIDTH}px;height:${FRAME_HEIGHT}px;display:flex;flex-direction:column;align-items:center;${placement}text-align:center}
    #panel{padding:24px 48px;border-radius:16px;${isOpaque ? '' : 'background:rgba(15,23,42,0.82);'}}
    h1{margin:0 0 16px;font-size:52px;line-height:1.2}
    .line{margin:8px 0;font-size:26px;color:#cbd5e1}
  </style></head><body><div id="frame"><div id="panel"><h1>${heading}</h1>${body}</div></div></body></html>`
}

async function renderOverlays(size: OutputSize, outroLines: string[]): Promise<Record<string, string>> {
  const browser = await chromium.launch({ channel: 'chrome' })
  const page = await browser.newPage({ viewport: { width: FRAME_WIDTH, height: FRAME_HEIGHT }, deviceScaleFactor: size.width / FRAME_WIDTH })
  const overlays: Record<string, string> = {}
  const definitions: Array<{ name: string; heading: string; lines: string[]; isOpaque: boolean }> = [
    { name: 'intro-card', heading: TITLE, lines: [AUTHOR_LINE, INTRO_SUBTITLE], isOpaque: true },
    { name: 'outro-card', heading: OUTRO_TITLE, lines: outroLines, isOpaque: true },
  ]
  for (const definition of definitions) {
    await page.setContent(overlayHtml(definition.heading, definition.lines, definition.isOpaque))
    const path = `${WORK_DIRECTORY}${definition.name}.png`
    await page.screenshot({ path, omitBackground: !definition.isOpaque })
    overlays[definition.name] = path
  }
  await browser.close()
  return overlays
}

function normalizeFilter(size: OutputSize): string {
  return `scale=${size.width}:${size.height}:force_original_aspect_ratio=decrease,pad=${size.width}:${size.height}:(ow-iw)/2:(oh-ih)/2:color=${BACKGROUND_COLOR},fps=${FRAMES_PER_SECOND},format=yuv420p`
}

function encodeArguments(outputPath: string): string[] {
  return ['-an', '-c:v', 'libx264', '-crf', CONSTANT_RATE_FACTOR, '-preset', 'medium', '-movflags', '+faststart', outputPath]
}

function makeCardClip(cardPath: string, outputPath: string, size: OutputSize) {
  runFfmpeg(['-loop', '1', '-t', String(CARD_SECONDS), '-i', cardPath, '-vf', normalizeFilter(size), ...encodeArguments(outputPath)])
}

function makeClip(clipPath: string, outputPath: string, size: OutputSize) {
  runFfmpeg(['-i', clipPath, '-vf', normalizeFilter(size), ...encodeArguments(outputPath)])
}

function makeSegmentClip(segmentPath: string, outputPath: string, size: OutputSize) {
  runFfmpeg(['-i', segmentPath, '-vf', normalizeFilter(size), ...encodeArguments(outputPath)])
}

function prepareMusic(options: Options, totalSeconds: number): string {
  if (options.music !== undefined) {
    return options.music
  }
  mkdirSync(AUDIO_DIRECTORY, { recursive: true })
  const generation = spawnSync('node', [MUSIC_GENERATOR_PATH, String(Math.ceil(totalSeconds) + 1)], { encoding: 'utf-8' })
  if (generation.status !== 0) {
    throw new Error(`Music generation failed: ${generation.stderr}`)
  }
  return GENERATED_MUSIC_PATH
}

function muxAudio(videoPath: string, options: Options, totalSeconds: number) {
  const musicPath = prepareMusic(options, totalSeconds)
  const voicePath = options.voice
  const musicLoudness = voicePath === undefined ? MUSIC_LOUDNESS_ALONE : MUSIC_LOUDNESS_UNDER_VOICE
  const fadeOutStart = Math.max(0, totalSeconds - MUSIC_FADE_OUT_SECONDS)
  const musicChain =
    `[1:a]aloop=loop=-1:size=2147483647,atrim=0:${totalSeconds},asetpts=N/SR/TB,` +
    `loudnorm=I=${musicLoudness}:TP=-3:LRA=7,` +
    `afade=t=in:st=0:d=${MUSIC_FADE_IN_SECONDS},afade=t=out:st=${fadeOutStart}:d=${MUSIC_FADE_OUT_SECONDS}[music]`
  const inputs = ['-i', videoPath, '-i', musicPath]
  let filter = musicChain
  let outputLabel = '[music]'
  if (voicePath !== undefined) {
    inputs.push('-i', voicePath)
    filter += `;[2:a]loudnorm=I=${VOICE_LOUDNESS}:TP=-2:LRA=7[voice];[music][voice]amix=inputs=2:duration=longest:normalize=0[mixed]`
    outputLabel = '[mixed]'
  }
  runFfmpeg([
    ...inputs,
    '-filter_complex', filter,
    '-map', '0:v', '-map', outputLabel, '-t', String(totalSeconds),
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', AUDIO_BITRATE, '-ar', AUDIO_SAMPLE_RATE, '-ac', '2',
    '-movflags', '+faststart', OUTPUT_PATH,
  ])
}

function formatTimestamp(seconds: number): string {
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE)
  const rest = Math.floor(seconds % SECONDS_PER_MINUTE)
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

function writeNarrationScript(entries: ScriptEntry[], scriptPath: string) {
  const lines = [
    '# Kịch bản thu âm',
    '',
    'Mỗi dòng ghi mốc thời gian trong video, rồi câu cần đọc. Số và ký hiệu đã viết thành chữ để đọc cho đúng.',
    'Thu thành một file âm thanh duy nhất, đủ độ dài video, rồi ghép bằng tùy chọn `--voice=`.',
    '',
    ...entries.map(entry => `- **${formatTimestamp(entry.startSeconds)}** ${toSpokenVietnamese(entry.text)}`),
    '',
  ]
  writeFileSync(scriptPath, lines.join('\n'))
}

async function main() {
  const options = parseOptions()
  rmSync(WORK_DIRECTORY, { recursive: true, force: true })
  mkdirSync(WORK_DIRECTORY, { recursive: true })
  const segmentNames = readdirSync(SEGMENTS_DIRECTORY).filter(name => name.endsWith('.webm')).sort()
  const size = readSegmentSize(`${SEGMENTS_DIRECTORY}${segmentNames[0]}`)
  const outroLines = options.musicCredit === undefined ? OUTRO_LINES : [...OUTRO_LINES, options.musicCredit]
  const overlays = await renderOverlays(size, outroLines)
  const clipPaths: string[] = []
  const scriptEntries: ScriptEntry[] = []

  let elapsedSeconds = 0
  if (!options.isPlain) {
    const introPath = `${WORK_DIRECTORY}00-intro.mp4`
    const introClip = options.intro ?? findMotionClip('intro')
    if (introClip !== undefined) {
      makeClip(introClip, introPath, size)
    } else {
      makeCardClip(overlays['intro-card'], introPath, size)
    }
    clipPaths.push(introPath)
    scriptEntries.push({ startSeconds: CARD_SPEECH_START_SECONDS, text: INTRO_SPEECH })
    elapsedSeconds = probeDuration(introPath)
  }

  segmentNames.forEach((name, index) => {
    const clipPath = `${WORK_DIRECTORY}${String(index + 1).padStart(2, '0')}-${name.replace('.webm', '.mp4')}`
    makeSegmentClip(`${SEGMENTS_DIRECTORY}${name}`, clipPath, size)
    clipPaths.push(clipPath)
    const captionsPath = `${SEGMENTS_DIRECTORY}${name}.captions.json`
    if (existsSync(captionsPath)) {
      const lines = JSON.parse(readFileSync(captionsPath, 'utf-8')) as CaptionLine[]
      lines.forEach(line => scriptEntries.push({ startSeconds: elapsedSeconds + line.startSeconds, text: line.text }))
    }
    elapsedSeconds += probeDuration(clipPath)
  })

  if (!options.isPlain) {
    const outroPath = `${WORK_DIRECTORY}99-outro.mp4`
    const outroClip = options.outro ?? findMotionClip('outro')
    if (outroClip !== undefined) {
      makeClip(outroClip, outroPath, size)
    } else {
      makeCardClip(overlays['outro-card'], outroPath, size)
    }
    clipPaths.push(outroPath)
    scriptEntries.push({ startSeconds: elapsedSeconds + CARD_SPEECH_START_SECONDS, text: OUTRO_SPEECH })
  }

  const listPath = `${WORK_DIRECTORY}clips.txt`
  writeFileSync(listPath, clipPaths.map(path => `file '${path}'`).join('\n') + '\n')
  const videoOnlyPath = `${WORK_DIRECTORY}video-only.mp4`
  runFfmpeg(['-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', videoOnlyPath])
  const totalSeconds = probeDuration(videoOnlyPath)
  if (options.isPlain) {
    runFfmpeg(['-i', videoOnlyPath, '-c', 'copy', '-movflags', '+faststart', PLAIN_OUTPUT_PATH])
    writeNarrationScript(scriptEntries, PLAIN_NARRATION_SCRIPT_PATH)
    console.log(`-> ${PLAIN_OUTPUT_PATH} (${formatTimestamp(totalSeconds)})`)
    console.log(`-> ${PLAIN_NARRATION_SCRIPT_PATH}`)
    return
  }
  muxAudio(videoOnlyPath, options, totalSeconds)
  writeNarrationScript(scriptEntries, NARRATION_SCRIPT_PATH)
  if (!existsSync(OUTPUT_PATH)) {
    throw new Error('The final video was not written')
  }
  console.log(`-> ${OUTPUT_PATH} (${formatTimestamp(totalSeconds)})`)
  console.log(`-> ${NARRATION_SCRIPT_PATH}`)
}

await main()
