// The pixel field: one grid that the background dots, the wordmark and the
// pixel bird all snap to. The bottom edge is a level meter that idles quietly
// and jumps while you "talk" (hold F). Moving the pointer lights nearby cells,
// clicking sends out a square ripple, and the wordmark glitches on hover.

import { onTalk, onTheme, prefersReducedMotion } from './events.ts'
import { type BirdRole, type Palette, type RGB, mix, readPalette, rgb } from './palette.ts'
import { FONT_ROWS, type FontCell, layout, measure } from './pixel-font.ts'

const WORD = 'mockingbird'
const WORD_COLS = measure(WORD)
const BIRD_HALF_CELLS_WIDE = 40

export interface FieldOptions {
  wordSlot?: HTMLElement | null
  birdSlot?: HTMLElement | null
  birdSrc?: string
  /** share of rows the bottom level meter may reach; 0 turns it off */
  horizon?: number
  /** probability that a background cell is lit */
  density?: number
  signal: AbortSignal
}

interface Box {
  x: number
  y: number
  w: number
  h: number
}

interface BirdPixel {
  x: number
  y: number
  role: BirdRole
}

interface Glitch {
  until: number
  mode: 'dither' | 'shift'
  dx: number
  row: number
}

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  life: number
}

// Stable per-cell noise in [0, 1).
function hash(x: number, y: number, seed = 0): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

const easeOut = (t: number) => 1 - (1 - t) ** 3
const clamp01 = (t: number) => Math.min(1, Math.max(0, t))

/** Grid cell size in px, chosen so the wordmark fits the viewport. */
export function cellSize(): number {
  let vw = Math.min(window.innerWidth, 1280)
  return Math.max(4, Math.min(10, Math.floor((vw - 40) / (WORD_COLS + 4))))
}

function sampleBird(img: HTMLImageElement): { w: number; h: number; pixels: BirdPixel[] } {
  // Downsample the logo into half cells and sort each opaque pixel into one
  // of the bird's facet colors by hue, so the bird recolors with the flavor.
  let w = BIRD_HALF_CELLS_WIDE
  let h = Math.round((w * img.naturalHeight) / img.naturalWidth)
  let off = document.createElement('canvas')
  off.width = w
  off.height = h
  let o = off.getContext('2d', { willReadFrequently: true })!
  o.drawImage(img, 0, 0, w, h)
  let data = o.getImageData(0, 0, w, h).data
  let pixels: BirdPixel[] = []
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let i = (y * w + x) * 4
      if (data[i + 3] < 120) continue
      let r = data[i] / 255
      let g = data[i + 1] / 255
      let b = data[i + 2] / 255
      let max = Math.max(r, g, b)
      let min = Math.min(r, g, b)
      let l = (max + min) / 2
      let hue = 0
      if (max !== min) {
        let d = max - min
        hue = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
        hue = (hue * 60 + 360) % 360
      }
      let role: BirdRole =
        hue > 245 && hue < 320 ? 'mauve' : hue > 205 ? 'blue' : l > 0.62 ? 'sky' : l > 0.45 ? 'teal' : 'tealDeep'
      pixels.push({ x, y, role })
    }
  }
  return { w, h, pixels }
}

export function createPixelField(host: HTMLElement, options: FieldOptions) {
  let { wordSlot = null, birdSlot = null, birdSrc, horizon = 0.2, density = 0.018, signal } = options
  let reduced = prefersReducedMotion()

  let canvas = document.createElement('canvas')
  canvas.className = 'pixel-canvas'
  canvas.setAttribute('aria-hidden', 'true')
  host.prepend(canvas)
  signal.addEventListener('abort', () => canvas.remove())
  let ctx = canvas.getContext('2d')!

  let W = 0
  let H = 0
  let C = 10
  let gap = 2
  let cols = 0
  let rows = 0
  let palette: Palette = readPalette()
  let heat = new Float32Array(0)
  let avoid = new Uint8Array(0)
  let word: FontCell[] = []
  let wordBox: Box | null = null
  let bird: BirdPixel[] = []
  let birdBox: (Box & { beak: { x: number; y: number } }) | null = null
  let birdSample: ReturnType<typeof sampleBird> | null = null
  let ripples: { x: number; y: number; at: number }[] = []
  let sparks: Spark[] = []
  let glitches = new Map<number, Glitch>()
  let level = 0
  let target = 0
  let recording = false
  let introAt: number | null = reduced ? -1 : null
  let running = false
  let visible = true
  let lastHover = 0
  let nextAutoGlitch = performance.now() + 3000

  function hostRect(el: HTMLElement): Box {
    let hr = host.getBoundingClientRect()
    let r = el.getBoundingClientRect()
    return {
      x: Math.round((r.left - hr.left) / C),
      y: Math.round((r.top - hr.top) / C),
      w: Math.round(r.width / C),
      h: Math.round(r.height / C),
    }
  }

  function placeArt() {
    word = []
    wordBox = null
    bird = []
    birdBox = null
    if (wordSlot) {
      let s = hostRect(wordSlot)
      let ox = s.x + Math.round((s.w - WORD_COLS) / 2)
      let oy = s.y + Math.round((s.h - FONT_ROWS) / 2)
      word = layout(WORD).map((c) => ({ ...c, x: c.x + ox, y: c.y + oy }))
      wordBox = { x: ox, y: oy, w: WORD_COLS, h: FONT_ROWS }
    }
    if (birdSlot && birdSample) {
      let s = hostRect(birdSlot)
      let bw = Math.ceil(birdSample.w / 2)
      let bh = Math.ceil(birdSample.h / 2)
      let ox = s.x + Math.round((s.w - bw) / 2)
      let oy = s.y + Math.round((s.h - bh) / 2)
      bird = birdSample.pixels.map((p) => ({ ...p, x: ox * 2 + p.x, y: oy * 2 + p.y }))
      birdBox = { x: ox, y: oy, w: bw, h: bh, beak: { x: ox + bw - 1, y: oy + Math.round(bh * 0.24) } }
    }
  }

  function buildAvoid() {
    avoid = new Uint8Array(cols * rows)
    let mark = (b: Box, pad: number) => {
      for (let y = b.y - pad; y < b.y + b.h + pad; y++) {
        for (let x = b.x - pad; x < b.x + b.w + pad; x++) {
          if (x >= 0 && y >= 0 && x < cols && y < rows) avoid[y * cols + x] = 1
        }
      }
    }
    if (wordBox) mark(wordBox, 2)
    if (birdBox) mark(birdBox, 1)
    host.querySelectorAll<HTMLElement>('[data-pixel-avoid]').forEach((el) => mark(hostRect(el), 1))
  }

  function resize() {
    let r = host.getBoundingClientRect()
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    C = cellSize()
    gap = C >= 8 ? 2 : 1
    document.documentElement.style.setProperty('--px', `${C}px`)
    W = Math.ceil(r.width)
    H = Math.ceil(r.height)
    cols = Math.ceil(W / C)
    rows = Math.ceil(H / C)
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = `${W}px`
    canvas.style.height = `${H}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    heat = new Float32Array(cols * rows)
    placeArt()
    buildAvoid()
    if (!running) draw(performance.now())
  }

  // ---------- interaction ----------

  function cellAt(e: PointerEvent) {
    let r = host.getBoundingClientRect()
    return { x: Math.floor((e.clientX - r.left) / C), y: Math.floor((e.clientY - r.top) / C) }
  }

  function inWord(c: { x: number; y: number }) {
    return Boolean(wordBox && c.x >= wordBox.x && c.x < wordBox.x + wordBox.w && c.y >= wordBox.y && c.y < wordBox.y + wordBox.h)
  }

  function warm(cx: number, cy: number, radius: number, strength: number) {
    for (let y = cy - radius; y <= cy + radius; y++) {
      for (let x = cx - radius; x <= cx + radius; x++) {
        if (x < 0 || y < 0 || x >= cols || y >= rows) continue
        let i = y * cols + x
        if (avoid[i]) continue
        let d = Math.hypot(x - cx, y - cy) / radius
        if (d > 1 || Math.random() > (1 - d) * strength) continue
        heat[i] = Math.max(heat[i], 0.55 + 0.45 * (1 - d))
      }
    }
  }

  function startGlitch(now: number, strong = false) {
    for (let k = 0; k < (strong ? 3 : 1); k++) {
      glitches.set(Math.floor(Math.random() * WORD.length), {
        until: now + 90 + Math.random() * 120,
        mode: Math.random() < 0.5 ? 'dither' : 'shift',
        dx: Math.random() < 0.5 ? -1 : 1,
        row: 3 + Math.floor(Math.random() * 7),
      })
    }
  }

  if (!reduced) {
    host.addEventListener(
      'pointermove',
      (e) => {
        let c = cellAt(e)
        if (inWord(c)) {
          let now = performance.now()
          if (now - lastHover > 70) {
            startGlitch(now)
            lastHover = now
          }
          return
        }
        warm(c.x, c.y, Math.max(4, Math.round(56 / C)), 0.6)
      },
      { signal },
    )
    host.addEventListener(
      'pointerdown',
      (e) => {
        if (e.target instanceof Element && e.target.closest('a, button, input')) return
        let c = cellAt(e)
        let now = performance.now()
        ripples.push({ x: c.x, y: c.y, at: now }, { x: c.x, y: c.y, at: now + 140 })
        if (inWord(c)) startGlitch(now, true)
      },
      { signal },
    )
  }

  // ---------- drawing ----------

  function square(x: number, y: number, color: string) {
    ctx.fillStyle = color
    ctx.fillRect(x * C, y * C, C - gap, C - gap)
  }

  function meterHeight(x: number, t: number) {
    // Two slow waves for idle breathing, plus faster speech-like jitter that
    // takes over as the level rises.
    let idle = 0.45 + 0.3 * Math.sin(x * 0.11 + t * 0.6) * Math.sin(x * 0.037 - t * 0.35)
    let talk = Math.abs(Math.sin(x * 0.29 + t * 7.3) * Math.sin(x * 0.13 - t * 4.1) + 0.6 * Math.sin(x * 0.71 + t * 11))
    let envelope = Math.sin((Math.PI * (x + 0.5)) / cols) ** 0.6
    return rows * horizon * envelope * (idle * (1 - level) + (0.35 + 0.9 * talk) * level)
  }

  function draw(now: number) {
    let t = now / 1000
    ctx.clearRect(0, 0, W, H)
    let dim = rgb(palette.dim)
    let mid = rgb(palette.mid)
    let lit = rgb(palette.lit)
    let crest = rgb(palette.crest)

    // background sprinkle + level meter
    for (let x = 0; x < cols; x++) {
      let mh = horizon ? meterHeight(x, reduced ? 0 : t) : 0
      for (let y = 0; y < rows; y++) {
        let i = y * cols + x
        if (avoid[i]) continue
        let r = hash(x, y)
        let depth = rows - y
        let on = false
        let tone = 0
        if (horizon && depth <= mh + 1) {
          let p = 1 - (depth - 1) / Math.max(mh, 1)
          on = r < 0.18 + 0.78 * p
          tone = depth > mh - 2 && level > 0.2 ? 2 : p > 0.75 ? 1 : 0
        } else {
          on = r < density
          if (on && !reduced && hash(x, y, 3) < 0.25) on = Math.sin(t * (0.4 + hash(x, y, 4)) + r * 40) > -0.3
          tone = hash(x, y, 2) > 0.92 ? 1 : 0
        }
        if (!on) continue
        square(x, y, tone === 2 ? (recording ? crest : lit) : tone === 1 ? mid : dim)
      }
    }

    if (!reduced) {
      // ripples: expanding square rings, dithered
      for (let rp of ripples) {
        let radius = Math.floor((now - rp.at) / 38)
        if (radius < 0) continue
        for (let y = rp.y - radius; y <= rp.y + radius; y++) {
          for (let x = rp.x - radius; x <= rp.x + radius; x++) {
            if (Math.max(Math.abs(x - rp.x), Math.abs(y - rp.y)) !== radius) continue
            if (x < 0 || y < 0 || x >= cols || y >= rows || (x + y) % 2) continue
            let i = y * cols + x
            if (!avoid[i]) heat[i] = Math.max(heat[i], 0.95 - radius * 0.035)
          }
        }
      }
      ripples = ripples.filter((rp) => now - rp.at < 38 * 22)

      // sparks: notes leaving the bird's beak while you talk
      for (let s of sparks) {
        s.x += s.vx
        s.y += s.vy
        s.life--
        let x = Math.round(s.x)
        let y = Math.round(s.y)
        if (x >= 0 && y >= 0 && x < cols && y < rows) heat[y * cols + x] = Math.max(heat[y * cols + x], s.life / 40)
      }
      sparks = sparks.filter((s) => s.life > 0)

      for (let i = 0; i < heat.length; i++) {
        let h = heat[i]
        if (h < 0.1) continue
        square(i % cols, Math.floor(i / cols), h > 0.85 ? crest : h > 0.6 ? lit : h > 0.35 ? mid : dim)
        heat[i] = h * 0.93
      }
    }

    // intro: pixels stream in from the upper right and settle into place
    let intro = introAt === null ? 0 : introAt < 0 ? 99 : (now - introAt) / 1000

    if (bird.length) {
      let hc = C / 2
      let hg = gap / 2
      let left = bird[0].x
      for (let p of bird) {
        let x = p.x
        let y = p.y
        if (intro < 1.6) {
          let delay = (p.x - left) * 0.006 + hash(p.x, p.y, 7) * 0.25
          let k = easeOut(clamp01((intro - delay) / 0.7))
          if (k <= 0) continue
          x = Math.round(p.x + (1 - k) * (30 + hash(p.x, p.y, 8) * 70))
          y = Math.round(p.y - (1 - k) * (20 + hash(p.x, p.y, 9) * 50))
        }
        let color: RGB = palette[p.role]
        if (!reduced && hash(p.x, p.y, Math.floor(t * 2)) > 0.985) color = palette.crest
        ctx.fillStyle = rgb(color)
        ctx.fillRect(x * hc, y * hc, hc - hg, hc - hg)
      }
    }

    if (word.length && wordBox) {
      for (let [letter, g] of glitches) if (g.until < now) glitches.delete(letter)
      if (!reduced && intro > 2 && now > nextAutoGlitch) {
        startGlitch(now)
        nextAutoGlitch = now + 3500 + Math.random() * 4000
      }
      for (let c of word) {
        let x = c.x
        let y = c.y
        let color = palette.bands[c.band]
        let g = glitches.get(c.letter)
        if (g) {
          if (g.mode === 'dither' && (c.x + c.y) % 2) continue
          if (g.mode === 'shift' && c.y >= g.row) x += g.dx
          color = mix(color, palette.crest, 0.4)
        }
        if (intro < 1.8) {
          let delay = 0.25 + (c.x - wordBox.x) * 0.012 + hash(c.x, c.y, 5) * 0.2
          let k = easeOut(clamp01((intro - delay) / 0.75))
          if (k <= 0) continue
          x = Math.round(c.x + (1 - k) * (20 + hash(c.x, c.y, 6) * 40))
          y = Math.round(c.y - (1 - k) * (8 + hash(c.x, c.y, 1) * 30))
        }
        ctx.fillStyle = rgb(color)
        ctx.fillRect(x * C, y * C, C, C)
      }
    }
  }

  function frame(now: number) {
    if (!running || signal.aborted) return
    level += (target - level) * (target > level ? 0.18 : 0.06)
    if (recording && birdBox && Math.random() < 0.45) {
      sparks.push({
        x: birdBox.beak.x + 1,
        y: birdBox.beak.y,
        vx: 0.25 + Math.random() * 0.35,
        vy: -0.12 - Math.random() * 0.3,
        life: 30 + Math.random() * 20,
      })
    }
    draw(now)
    requestAnimationFrame(frame)
  }

  function start() {
    if (running || reduced || !visible) return
    running = true
    requestAnimationFrame(frame)
  }

  let io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    if (visible) start()
    else running = false
  })
  io.observe(host)
  let ro = new ResizeObserver(() => resize())
  ro.observe(host)
  signal.addEventListener('abort', () => {
    io.disconnect()
    ro.disconnect()
    running = false
  })

  onTheme(() => {
    palette = readPalette()
    if (!running) draw(performance.now())
  }, signal)
  onTalk((state) => {
    recording = state === 'listening'
    target = recording ? 1 : 0
  }, signal)

  function boot() {
    resize()
    if (introAt === null) introAt = performance.now()
    start()
  }

  if (birdSrc && birdSlot) {
    let img = new Image()
    img.onload = () => {
      birdSample = sampleBird(img)
      boot()
    }
    img.onerror = boot
    img.src = birdSrc
  } else {
    boot()
  }
}
