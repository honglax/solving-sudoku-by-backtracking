import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { DemoStage, FULL_FRAME_SCALE, ULTRA_HD_SCALE } from './demoStage.ts'
import {
  phoneSiteWidth,
  recordAutoPlay,
  recordEdgeCases,
  recordExtensions,
  recordHomeAndPages,
  recordInputWays,
  recordInstantSolve,
  recordPhoneLayout,
  recordSolverComponents,
  recordStepping,
  recordTerminal,
} from './scenes.ts'

type Scene = {
  number: number
  name: string
  record: (stage: DemoStage) => Promise<void>
  siteWidth?: number
}

const SCENES: Scene[] = [
  { number: 1, name: 'home-and-pages', record: recordHomeAndPages },
  { number: 2, name: 'solver-components', record: recordSolverComponents },
  { number: 3, name: 'input-ways', record: recordInputWays },
  { number: 4, name: 'stepping', record: recordStepping },
  { number: 5, name: 'auto-play', record: recordAutoPlay },
  { number: 6, name: 'instant-solve', record: recordInstantSolve },
  { number: 7, name: 'edge-cases', record: recordEdgeCases },
  { number: 8, name: 'extensions', record: recordExtensions },
  { number: 9, name: 'phone-layout', record: recordPhoneLayout, siteWidth: phoneSiteWidth() },
  { number: 10, name: 'terminal', record: recordTerminal },
]

const DEFAULT_SITE_URL = 'http://localhost:4173'
const SEGMENTS_DIRECTORY = fileURLToPath(new URL('../../../video/segments/', import.meta.url))
const SCENES_FLAG = '--scenes='
const FULL_FRAME_FLAG = '--hd'

function parseArguments(): { siteUrl: string; sceneNumbers: number[]; scale: number } {
  const argumentsList = process.argv.slice(2)
  const scenesArgument = argumentsList.find(argument => argument.startsWith(SCENES_FLAG))
  const siteUrl = argumentsList.find(argument => !argument.startsWith('--')) ?? DEFAULT_SITE_URL
  const sceneNumbers =
    scenesArgument === undefined
      ? SCENES.map(scene => scene.number)
      : scenesArgument.slice(SCENES_FLAG.length).split(',').map(Number)
  const scale = argumentsList.includes(FULL_FRAME_FLAG) ? FULL_FRAME_SCALE : ULTRA_HD_SCALE
  return { siteUrl, sceneNumbers, scale }
}

async function main() {
  const { siteUrl, sceneNumbers, scale } = parseArguments()
  mkdirSync(SEGMENTS_DIRECTORY, { recursive: true })
  const browser = await chromium.launch({ channel: 'chrome' })
  for (const scene of SCENES.filter(candidate => sceneNumbers.includes(candidate.number))) {
    const startedAt = Date.now()
    const stage = await DemoStage.open(browser, siteUrl, SEGMENTS_DIRECTORY, scene.siteWidth, scale)
    const outputPath = `${SEGMENTS_DIRECTORY}scene-${String(scene.number).padStart(2, '0')}-${scene.name}.webm`
    try {
      await scene.record(stage)
    } finally {
      await stage.close(outputPath)
    }
    console.log(`scene ${scene.number} ${scene.name}: ${((Date.now() - startedAt) / 1000).toFixed(1)} s -> ${outputPath}`)
  }
  await browser.close()
}

await main()
