import type { Browser, FrameLocator, Locator, Page } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import captions from './captions.vi.json' with { type: 'json' }

export const FRAME_WIDTH = 1366
export const SITE_HEIGHT = 680
export const CAPTION_HEIGHT = 88
export const FRAME_HEIGHT = SITE_HEIGHT + CAPTION_HEIGHT
export const ULTRA_HD_WIDTH = 3840
export const ULTRA_HD_HEIGHT = 2160
export const ULTRA_HD_SCALE = ULTRA_HD_HEIGHT / FRAME_HEIGHT
export const FULL_FRAME_SCALE = 1

const HOST_PATH = '/__demo-host'
const MINIMUM_CAPTION_SECONDS = 2.4
const SECONDS_PER_CHARACTER = 0.07
const CURSOR_TRAVEL_MILLISECONDS = 700
const BEFORE_CLICK_MILLISECONDS = 220
const AFTER_CLICK_MILLISECONDS = 450
const HIGHLIGHT_PADDING = 6
const TYPING_DELAY_MILLISECONDS = 260
const MILLISECONDS_PER_SECOND = 1000

export type CaptionKey = keyof typeof captions

export type CaptionLine = {
  startSeconds: number
  text: string
}

type DemoWindow = Window & {
  demo: {
    caption: (text: string) => void
    ring: (box: { x: number; y: number; width: number; height: number } | null) => void
    cursor: (point: { x: number; y: number }) => void
    resizeSite: (width: number) => void
    showTerminal: (text: string) => void
    showSite: () => void
  }
}

function hostPageHtml(zoom: number): string {
  return `<!doctype html>
<html lang="vi" style="zoom: ${zoom}">
<head>
<meta charset="utf-8">
<style>
  html, body { margin: 0; background: #0f172a; font-family: system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif; }
  #stage { position: relative; width: ${FRAME_WIDTH}px; height: ${SITE_HEIGHT}px; display: flex; justify-content: center; background: #0f172a; overflow: hidden; }
  #site { width: ${FRAME_WIDTH}px; height: ${SITE_HEIGHT}px; border: 0; background: #fff; }
  #terminal { display: none; box-sizing: border-box; width: ${FRAME_WIDTH}px; height: ${SITE_HEIGHT}px; margin: 0; padding: 32px 48px; background: #0b1020; color: #e2e8f0; font: 20px/1.45 "JetBrains Mono", Menlo, monospace; white-space: pre; overflow: hidden; }
  #ring { position: absolute; z-index: 10; pointer-events: none; border: 4px solid #f59e0b; border-radius: 12px; box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.35); opacity: 0; transition: opacity 250ms, left 250ms, top 250ms, width 250ms, height 250ms; }
  #cursor { position: absolute; z-index: 11; pointer-events: none; width: 28px; height: 28px; left: 40px; top: 40px; transition: left ${CURSOR_TRAVEL_MILLISECONDS}ms ease-in-out, top ${CURSOR_TRAVEL_MILLISECONDS}ms ease-in-out; filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.5)); }
  #caption { box-sizing: border-box; height: ${CAPTION_HEIGHT}px; padding: 0 64px; display: flex; align-items: center; justify-content: center; text-align: center; color: #f8fafc; font-size: 24px; line-height: 1.3; background: #0f172a; border-top: 2px solid #334155; }
</style>
</head>
<body>
<div id="stage">
  <iframe id="site" title="site"></iframe>
  <pre id="terminal"></pre>
  <div id="ring"></div>
  <svg id="cursor" viewBox="0 0 24 24"><path d="M3 2 L3 19 L8 14.5 L11.5 22 L14.5 20.7 L11 13.5 L18 13.5 Z" fill="#ffffff" stroke="#0f172a" stroke-width="1.6" stroke-linejoin="round"/></svg>
</div>
<div id="caption"></div>
<script>
  window.demo = {
    caption(text) { document.getElementById('caption').textContent = text },
    ring(box) {
      const ring = document.getElementById('ring')
      if (box === null) { ring.style.opacity = '0'; return }
      ring.style.left = box.x + 'px'
      ring.style.top = box.y + 'px'
      ring.style.width = box.width + 'px'
      ring.style.height = box.height + 'px'
      ring.style.opacity = '1'
    },
    cursor(point) {
      const cursor = document.getElementById('cursor')
      cursor.style.left = point.x + 'px'
      cursor.style.top = point.y + 'px'
    },
    resizeSite(width) { document.getElementById('site').style.width = width + 'px' },
    showTerminal(text) {
      document.getElementById('cursor').style.display = 'none'
      document.getElementById('site').style.display = 'none'
      const terminal = document.getElementById('terminal')
      terminal.style.display = 'block'
      terminal.textContent = text
    },
    showSite() {
      document.getElementById('cursor').style.display = ''
      document.getElementById('terminal').style.display = 'none'
      document.getElementById('site').style.display = 'block'
    },
  }
</script>
</body>
</html>`
}

export function captionText(key: CaptionKey, values: Record<string, string> = {}): string {
  return Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), captions[key])
}

export class DemoStage {
  readonly site: FrameLocator
  readonly page: Page
  private readonly siteUrl: string
  private readonly startedAt: number
  private readonly captionLines: CaptionLine[] = []

  private constructor(page: Page, siteUrl: string, startedAt: number) {
    this.page = page
    this.siteUrl = siteUrl
    this.startedAt = startedAt
    this.site = page.frameLocator('#site')
  }

  static async open(
    browser: Browser,
    siteUrl: string,
    videoDirectory: string,
    siteWidth = FRAME_WIDTH,
    scale = ULTRA_HD_SCALE,
  ): Promise<DemoStage> {
    mkdirSync(videoDirectory, { recursive: true })
    const isUltraHd = scale === ULTRA_HD_SCALE
    const videoSize = isUltraHd ? { width: ULTRA_HD_WIDTH, height: ULTRA_HD_HEIGHT } : { width: FRAME_WIDTH, height: FRAME_HEIGHT }
    const context = await browser.newContext({
      viewport: videoSize,
      recordVideo: { dir: videoDirectory, size: videoSize },
      locale: 'vi-VN',
      colorScheme: 'light',
    })
    const page = await context.newPage()
    const startedAt = Date.now()
    const hostUrl = `${siteUrl}${HOST_PATH}`
    await page.route(hostUrl, route => route.fulfill({ contentType: 'text/html', body: hostPageHtml(scale) }))
    await page.goto(hostUrl)
    await page.evaluate(width => (window as unknown as DemoWindow).demo.resizeSite(width), siteWidth)
    return new DemoStage(page, siteUrl, startedAt)
  }

  async close(outputPath: string) {
    const video = this.page.video()
    await this.page.context().close()
    writeFileSync(`${outputPath}.captions.json`, JSON.stringify(this.captionLines, null, 2) + '\n')
    await video?.saveAs(outputPath)
    await video?.delete()
  }

  async openSitePath(path: string) {
    await this.page.evaluate(() => (window as unknown as DemoWindow).demo.showSite())
    await this.page.evaluate(
      url =>
        new Promise<void>(resolve => {
          const frame = document.getElementById('site') as HTMLIFrameElement
          frame.addEventListener('load', () => resolve(), { once: true })
          frame.src = url
        }),
      `${this.siteUrl}${path}`,
    )
    await this.page.waitForTimeout(AFTER_CLICK_MILLISECONDS)
  }

  async showCaption(text: string) {
    await this.page.evaluate(captionText => (window as unknown as DemoWindow).demo.caption(captionText), text)
    this.captionLines.push({ startSeconds: (Date.now() - this.startedAt) / MILLISECONDS_PER_SECOND, text })
  }

  async narrate(key: CaptionKey, values: Record<string, string> = {}) {
    const text = captionText(key, values)
    await this.showCaption(text)
    await this.pause(Math.max(MINIMUM_CAPTION_SECONDS, text.length * SECONDS_PER_CHARACTER))
  }

  async pause(seconds: number) {
    await this.page.waitForTimeout(seconds * MILLISECONDS_PER_SECOND)
  }

  async highlight(target: Locator, holdSeconds = MINIMUM_CAPTION_SECONDS) {
    const box = await target.boundingBox()
    if (box === null) {
      throw new Error('Cannot highlight an element without a bounding box')
    }
    const ringBox = {
      x: box.x - HIGHLIGHT_PADDING,
      y: box.y - HIGHLIGHT_PADDING,
      width: box.width + HIGHLIGHT_PADDING * 2,
      height: box.height + HIGHLIGHT_PADDING * 2,
    }
    await this.page.evaluate(ring => (window as unknown as DemoWindow).demo.ring(ring), ringBox)
    await this.pause(holdSeconds)
    await this.clearHighlight()
  }

  async clearHighlight() {
    await this.page.evaluate(() => (window as unknown as DemoWindow).demo.ring(null))
  }

  async moveCursorTo(target: Locator) {
    const box = await target.boundingBox()
    if (box === null) {
      throw new Error('Cannot move the cursor to an element without a bounding box')
    }
    const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
    await this.page.evaluate(cursorPoint => (window as unknown as DemoWindow).demo.cursor(cursorPoint), point)
    await this.page.waitForTimeout(CURSOR_TRAVEL_MILLISECONDS)
  }

  async click(target: Locator) {
    await this.moveCursorTo(target)
    await this.page.waitForTimeout(BEFORE_CLICK_MILLISECONDS)
    await this.press(target)
    await this.page.waitForTimeout(AFTER_CLICK_MILLISECONDS)
  }

  private async press(target: Locator) {
    await target.evaluate(element => (element as HTMLElement).click())
  }

  async clickQuickly(target: Locator, intervalSeconds: number) {
    await this.press(target)
    await this.pause(intervalSeconds)
  }

  async type(target: Locator, text: string) {
    await this.click(target)
    await target.focus()
    await this.page.keyboard.type(text, { delay: TYPING_DELAY_MILLISECONDS })
    await this.page.waitForTimeout(AFTER_CLICK_MILLISECONDS)
  }

  async selectOption(target: Locator, value: string) {
    await this.moveCursorTo(target)
    await this.page.waitForTimeout(BEFORE_CLICK_MILLISECONDS)
    await target.selectOption(value)
    await this.page.waitForTimeout(AFTER_CLICK_MILLISECONDS)
  }

  async showTerminal(text: string) {
    await this.page.evaluate(terminalText => (window as unknown as DemoWindow).demo.showTerminal(terminalText), text)
  }
}
