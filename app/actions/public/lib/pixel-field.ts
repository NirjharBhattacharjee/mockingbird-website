// The pixel field: one fixed canvas behind the whole home page, on a grid of
// square cells.
//
// - Background dots twinkle. The bottom edge is a level meter that idles in
//   the hero and jumps anywhere on the page while you "talk" (hold F).
// - The pointer lights nearby cells, a click sends out a square ripple.
// - In the hero, a pool of pixels spells the "mockingbird" wordmark. It
//   cycles color while idle, glitches when you hover it, and pixels shy away
//   from the pointer. Scroll down and the same pixels fly off and re-form
//   into each scene's shape (the transition element), and back again.
// - The pixel bird flies up into the nav as you scroll and becomes the home
//   link, then flies back down when you return to the top.
//
// Rendering: the background goes straight onto the canvas. Shapes, the
// wordmark and the bird go onto their own layer, which is also drawn small and
// blurred underneath them as a neon glow (added light in the dark flavors, a
// tinted shadow in Latte). Pixels are batched by color, one fill per color.
// Shapes are dense (cells about 0.6 of the grid), turn in 3D with perspective
// (sizes snap to whole pixels, brightness drops in steps with depth), and a
// shared wave field ripples them under the pointer.

import { currentSceneIndex, onTalk, onTheme, prefersReducedMotion, scenes } from './events.ts'
import { type Palette, type RGB, type Role, bands, mix, readPalette, rgb } from './palette.ts'
import { FLAP, LIFT, type BirdCell, flapFrame } from './bird.ts'
import { FONT_ROWS, layout, measure } from './pixel-font.ts'
import { type Cell, MOTION, type Motion, SWAY, buildShape, loadShapeFonts, outline, sampleLogo } from './shapes.ts'

const WORD = 'mockingbird'
const WORD_COLS = measure(WORD)
const MORPH_MS = 900
/** how far through the hero (0-1) you scroll before the wordmark lets go */
const WORD_UNTIL = 0.45
/** the wordmark cycles through the bird's own colors, ordered so neighbors blend */
const ACCENTS = ['sky', 'teal', 'blue', 'lavender', 'mauve'] as const
const ACCENT_MS = 2600

interface FieldOptions {
  birdSrc?: string
  signal: AbortSignal
}

interface Formation {
  cells: (Cell & { letter?: number })[]
  size: { w: number; h: number }
  /** px per cell: the wordmark has its own, larger cells, shapes smaller ones */
  cell: number
  /** px between neighboring pixels */
  gap: number
  anchor: HTMLElement
  motion?: Motion
  /** current turn around the vertical axis, radians */
  angle: number
}

/** how far toward the background each depth step pulls a pixel's color */
const DEPTH = [0, 0.16, 0.32, 0.48]

interface Particle {
  /** where it was last drawn, px */
  x: number
  y: number
  /** where its current flight started */
  sx: number
  sy: number
  /** its color at the start of the flight, and as last drawn */
  from: RGB
  color: RGB
  delay: number
  /** sideways swing during a flight, px */
  curl: number
  /** offset from the pointer pushing it away, px */
  px: number
  py: number
  /** a spare pixel the current shape doesn't use */
  spare: boolean
  /** drawn size in px at the start of the flight, and as last drawn */
  fromSize: number
  size: number
}

interface Glitch {
  until: number
  mode: 'dither' | 'shift'
  dx: number
  row: number
}

// Stable per-cell noise in [0, 1).
function hash(x: number, y: number, seed = 0): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

const easeOut = (t: number) => 1 - (1 - t) ** 3
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const clamp01 = (t: number) => Math.min(1, Math.max(0, t))
const clamp = (t: number, max: number) => Math.min(max, Math.max(-max, t))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Grid cell size in px, chosen so the wordmark fits the viewport. */
function cellSize(): number {
  let vw = Math.min(window.innerWidth, 1280)
  return Math.max(4, Math.min(10, Math.floor((vw - 40) / (WORD_COLS + 4))))
}

/**
 * The wordmark's own cell size: it spans about 88% of the width, so it's the
 * first thing you see, while the background grid stays fine. Same formula
 * as --wpx in public/theme-init.js.
 */
function wordCellSize(): number {
  return Math.max(4, Math.floor((Math.min(window.innerWidth, 1600) * 0.88) / WORD_COLS))
}

export function createPixelField({ birdSrc, signal }: FieldOptions) {
  let reduced = prefersReducedMotion()
  let root = document.documentElement

  let canvas = document.createElement('canvas')
  canvas.className = 'pixel-canvas'
  canvas.setAttribute('aria-hidden', 'true')
  document.body.prepend(canvas)
  signal.addEventListener('abort', () => canvas.remove())
  let ctx = canvas.getContext('2d')!
  // the shape layer, and its small blurred copy (the glow)
  let fg = document.createElement('canvas')
  let fx = fg.getContext('2d')!
  let glow = document.createElement('canvas')
  let gx = glow.getContext('2d')!
  let glowOn = true
  // 1 normally; drops to 0.6 (bigger, fewer pixels) if frames run slow
  let density = 1
  let slowFrames = 0
  let frameMs = 16
  let lastFrame = 0

  let hero = document.getElementById('top')
  let wordSlot = document.getElementById('wordmark-slot')
  let birdSlot = document.getElementById('bird-slot')
  let home = document.getElementById('home-slot')
  let homeImg = home?.querySelector('img') ?? null
  let sceneList = scenes()

  let W = 0
  let H = 0
  let C = 10
  let WC = 10
  let gap = 2
  let cols = 0
  let rows = 0
  let palette: Palette = readPalette()
  let logo: HTMLImageElement | null = null
  let bird: ReturnType<typeof sampleLogo> | null = null
  // the flap: one set of cells per frame, and the Latte ring around each
  let birdFrames: BirdCell<Role>[][] = []
  let birdRings: { x: number; y: number }[][] = []
  let flutterAt = -1e9
  let birdBox: { x: number; y: number; w: number; h: number } | null = null
  let feathers: { x: number; y: number; vx: number; vy: number; life: number; role: Role }[] = []

  let formations = new Map<string, Formation>()
  let particles: Particle[] = []
  let active = ''
  let morphAt = 0
  // the pipeline stage the "how it works" tabs point at (Listen starts checked)
  let highlight = 1
  let pointer: { x: number; y: number } | null = null

  let heat = new Float32Array(0)
  // the wave field: two height buffers, stepped with a damped wave equation
  let wave = new Float32Array(0)
  let wavePrev = new Float32Array(0)
  let ripples: { x: number; y: number; at: number }[] = []
  let sparks: { x: number; y: number; vx: number; vy: number; life: number }[] = []
  let glitches = new Map<number, Glitch>()
  let level = 0
  let target = 0
  let recording = false
  let bootAt = 0
  let lastHover = 0
  let nextAutoGlitch = 0
  let running = false
  let drawQueued = false

  // ---------- layout ----------

  function heroProgress() {
    if (!hero) return 1
    let r = hero.getBoundingClientRect()
    return clamp01(-r.top / (r.height * 0.55))
  }

  function buildFormations() {
    formations.clear()
    if (wordSlot) {
      let cells = layout(WORD).map((c) => ({ x: c.x, y: c.y, letter: c.letter, group: c.band, role: 'sky' as const }))
      formations.set('top', { cells, size: { w: WORD_COLS, h: FONT_ROWS }, cell: WC, gap: 0, anchor: wordSlot, angle: 0 })
    }
    for (let scene of sceneList) {
      let stage = scene.querySelector<HTMLElement>('[data-stage]')
      let shape = scene.dataset.shape
      if (!stage || !shape) continue
      let r = stage.getBoundingClientRect()
      // dense: cells about 0.6 of the grid, so a shape has thousands of pixels
      let cell = Math.max(3, Math.round((C * 0.6) / density))
      // big enough to frame the centered panel: wings and edges show around it
      let size = Math.max(8, Math.floor(Math.min(r.width * 0.88, H * 1.05) / cell))
      let cells = buildShape(shape, size, logo)
      // shuffle, so a morph sends pixels criss-crossing like a flock
      cells.sort((a, b) => hash(a.x, a.y, 11) - hash(b.x, b.y, 11))
      formations.set(scene.id, { cells, size: { w: size, h: size }, cell, gap: cell >= 5 ? 1 : 0, anchor: stage, motion: MOTION[shape] ?? SWAY, angle: 0 })
    }
    let need = Math.max(0, ...[...formations.values()].map((f) => f.cells.length))
    while (particles.length < need) {
      let i = particles.length
      particles.push({ x: -C, y: -C, sx: -C, sy: -C, from: palette.bg, color: palette.bg, delay: 0, curl: (hash(i, 1, 2) - 0.5) * 160, px: 0, py: 0, spare: true, fromSize: C, size: C })
    }
  }

  function origin(f: Formation) {
    let r = f.anchor.getBoundingClientRect()
    return { x: Math.round(r.left + (r.width - f.size.w * f.cell) / 2), y: Math.round(r.top + (r.height - f.size.h * f.cell) / 2) }
  }

  function resize() {
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    C = cellSize()
    WC = wordCellSize()
    root.style.setProperty('--wpx', `${WC}px`)
    gap = C >= 8 ? 2 : 1
    root.style.setProperty('--px', `${C}px`)
    W = root.clientWidth
    H = window.innerHeight
    cols = Math.ceil(W / C)
    rows = Math.ceil(H / C)
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = `${W}px`
    canvas.style.height = `${H}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    fg.width = W * dpr
    fg.height = H * dpr
    fx.setTransform(dpr, 0, 0, dpr, 0, 0)
    glow.width = Math.ceil(W / 4)
    glow.height = Math.ceil(H / 4)
    gx.filter = 'blur(3px)'
    heat = new Float32Array(cols * rows)
    wave = new Float32Array(cols * rows)
    wavePrev = new Float32Array(cols * rows)
    buildFormations()
    requestDraw()
  }

  // ---------- morphing ----------

  /** Which formation the pixels should be in right now. */
  function wanted(p: number) {
    let i = currentSceneIndex(sceneList)
    if (i === 0 && p >= WORD_UNTIL) i = 1
    return sceneList[i]?.id ?? 'top'
  }

  function morphTo(key: string, now: number) {
    // spare pixels set off from somewhere inside the shape they leave
    let old = formations.get(active)
    let o = old && origin(old)
    particles.forEach((pt, i) => {
      if (pt.spare && old && o) {
        pt.x = o.x + hash(i, 3) * old.size.w * old.cell
        pt.y = o.y + hash(i, 4) * old.size.h * old.cell
      }
      pt.sx = pt.x
      pt.sy = pt.y
      pt.from = pt.color
      pt.fromSize = pt.size
      pt.delay = reduced ? 0 : hash(i, 7) * 280
    })
    active = key
    morphAt = now
  }

  // The wordmark's first appearance: pixels stream in from the upper right.
  function intro(now: number) {
    let f = formations.get('top')
    active = 'top'
    morphAt = now
    if (!f) return
    let o = origin(f)
    particles.forEach((pt, i) => {
      let c = f.cells[i]
      if (!c) return
      pt.sx = o.x + (c.x + 20 + hash(c.x, c.y, 6) * 40) * f.cell
      pt.sy = o.y + (c.y - 8 - hash(c.x, c.y, 1) * 30) * f.cell
      pt.fromSize = f.cell
      pt.from = palette.bg
      pt.delay = 250 + c.x * 12 + hash(c.x, c.y, 5) * 200
    })
  }

  // ---------- interaction ----------

  function warm(cx: number, cy: number, radius: number, strength: number) {
    for (let y = cy - radius; y <= cy + radius; y++) {
      for (let x = cx - radius; x <= cx + radius; x++) {
        if (x < 0 || y < 0 || x >= cols || y >= rows) continue
        let d = Math.hypot(x - cx, y - cy) / radius
        if (d > 1 || Math.random() > (1 - d) * strength) continue
        let i = y * cols + x
        heat[i] = Math.max(heat[i], 0.55 + 0.45 * (1 - d))
      }
    }
  }

  // A click on the bird: a burst of fast wingbeats, a hop, a flash along the
  // wings, and a few feathers drifting down.
  function flutter(now: number) {
    flutterAt = now
    let b = birdBox
    if (!b || !bird) return
    for (let i = 0; i < 4; i++) {
      feathers.push({
        x: b.x + b.w * (0.2 + Math.random() * 0.4),
        y: b.y + b.h * (0.15 + Math.random() * 0.2),
        vx: (Math.random() - 0.5) * 1.2,
        vy: 0.4 + Math.random() * 0.6,
        life: 70 + Math.random() * 30,
        role: Math.random() < 0.5 ? 'mauve' : 'sky',
      })
    }
  }

  /** Drops `strength` into the wave field around a grid cell. */
  function splash(x: number, y: number, strength: number) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        let gx = x + dx
        let gy = y + dy
        if (gx > 0 && gy > 0 && gx < cols - 1 && gy < rows - 1) wave[gy * cols + gx] += strength * (dx || dy ? 0.5 : 1)
      }
    }
  }

  // One step of the damped wave equation over the grid.
  function stepWave() {
    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < cols - 1; x++) {
        let i = y * cols + x
        wavePrev[i] = ((wave[i - 1] + wave[i + 1] + wave[i - cols] + wave[i + cols]) / 2 - wavePrev[i]) * 0.94
      }
    }
    ;[wave, wavePrev] = [wavePrev, wave]
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

  function overWord(x: number, y: number) {
    let f = formations.get('top')
    if (active !== 'top' || !f) return false
    let o = origin(f)
    return x >= o.x && y >= o.y && x < o.x + f.size.w * f.cell && y < o.y + f.size.h * f.cell
  }

  if (!reduced) {
    window.addEventListener(
      'pointermove',
      (e) => {
        pointer = { x: e.clientX, y: e.clientY }
        let now = performance.now()
        if (overWord(e.clientX, e.clientY)) {
          if (now - lastHover > 70) {
            startGlitch(now)
            lastHover = now
          }
          return
        }
        let cx = Math.floor(e.clientX / C)
        let cy = Math.floor(e.clientY / C)
        warm(cx, cy, Math.max(4, Math.round(56 / C)), 0.6)
        splash(cx, cy, 0.5)
      },
      { signal },
    )
    document.addEventListener(
      'pointerout',
      (e) => {
        if (!e.relatedTarget) pointer = null
      },
      { signal },
    )
    window.addEventListener(
      'pointerdown',
      (e) => {
        if (e.target instanceof Element && e.target.closest('a, button, input, label, .panel')) return
        let now = performance.now()
        let x = Math.floor(e.clientX / C)
        let y = Math.floor(e.clientY / C)
        ripples.push({ x, y, at: now }, { x, y, at: now + 140 })
        splash(x, y, 3)
        let b = birdBox
        if (b && e.clientX >= b.x && e.clientX < b.x + b.w && e.clientY >= b.y && e.clientY < b.y + b.h) flutter(now)
        if (overWord(e.clientX, e.clientY)) startGlitch(now, true)
      },
      { signal },
    )
  }

  // The "how it works" tabs light up their stage of the pipeline shape.
  document.addEventListener(
    'change',
    (e) => {
      let input = e.target as HTMLInputElement
      if (input.name !== 'how') return
      highlight = Number(input.value) + 1
      requestDraw()
    },
    { signal },
  )

  // ---------- drawing ----------

  // Color strings are cached (by packed rgb, and by rgb + depth + dimmed),
  // and pixels are batched by color: one path and one fill per color.
  let strings = new Map<number, string>()
  let shades = new Map<number, string>()
  const pack = (c: RGB) => (c[0] << 16) | (c[1] << 8) | c[2]
  function css(c: RGB) {
    let k = pack(c)
    let str = strings.get(k)
    if (!str) {
      if (strings.size > 4096) strings.clear()
      strings.set(k, (str = rgb(c)))
    }
    return str
  }
  /** `c` pushed back `depth` steps, and dimmed behind a text panel. */
  function shade(c: RGB, depth: number, dim: boolean) {
    let k = pack(c) * 8 + depth * 2 + (dim ? 1 : 0)
    let str = shades.get(k)
    if (!str) {
      if (shades.size > 8192) shades.clear()
      shades.set(k, (str = css(mix(c, palette.bg, 1 - (1 - DEPTH[depth]) * (dim ? 0.4 : 1)))))
    }
    return str
  }
  let batch = new Map<string, number[]>()
  function paint(color: string, x: number, y: number, size: number) {
    let b = batch.get(color)
    if (!b) batch.set(color, (b = []))
    // whole pixels, so edges stay crisp (no antialiasing)
    b.push(Math.round(x), Math.round(y), size)
  }
  function flush(pen: CanvasRenderingContext2D) {
    for (let [color, b] of batch) {
      if (!b.length) continue
      pen.fillStyle = color
      pen.beginPath()
      for (let i = 0; i < b.length; i += 3) pen.rect(b[i], b[i + 1], b[i + 2], b[i + 2])
      pen.fill()
      b.length = 0
    }
  }

  function square(x: number, y: number, color: string) {
    paint(color, x * C, y * C, C - gap)
  }

  function meterHeight(x: number, t: number, show: number) {
    // Two slow waves for idle breathing, plus faster speech-like jitter that
    // takes over as the level rises.
    let idle = 0.45 + 0.3 * Math.sin(x * 0.11 + t * 0.6) * Math.sin(x * 0.037 - t * 0.35)
    let talk = Math.abs(Math.sin(x * 0.29 + t * 7.3) * Math.sin(x * 0.13 - t * 4.1) + 0.6 * Math.sin(x * 0.71 + t * 11))
    let envelope = Math.sin((Math.PI * (x + 0.5)) / cols) ** 0.6
    return rows * 0.22 * envelope * (idle * (1 - level) * show + (0.35 + 0.9 * talk) * level)
  }

  function drawBackground(now: number, p: number) {
    let t = reduced ? 0 : now / 1000
    let dim = rgb(palette.dim)
    let mid = rgb(palette.mid)
    let lit = rgb(palette.lit)
    let crest = rgb(palette.crest)
    let show = 1 - clamp01(p * 1.6)

    for (let x = 0; x < cols; x++) {
      let mh = meterHeight(x, t, show)
      for (let y = 0; y < rows; y++) {
        let r = hash(x, y)
        let depth = rows - y
        let on = false
        let tone = 0
        if (depth <= mh + 1 && mh > 0.5) {
          let q = 1 - (depth - 1) / Math.max(mh, 1)
          on = r < 0.18 + 0.78 * q
          tone = depth > mh - 2 && level > 0.2 ? 2 : q > 0.75 ? 1 : 0
        } else {
          on = r < 0.018
          if (on && !reduced && hash(x, y, 3) < 0.25) on = Math.sin(t * (0.4 + hash(x, y, 4)) + r * 40) > -0.3
          tone = hash(x, y, 2) > 0.92 ? 1 : 0
        }
        if (on) square(x, y, tone === 2 ? (recording ? crest : lit) : tone === 1 ? mid : dim)
      }
    }

    if (reduced) return flush(ctx)
    // ripples: expanding square rings, dithered
    for (let rp of ripples) {
      let radius = Math.floor((now - rp.at) / 38)
      if (radius < 0) continue
      for (let y = rp.y - radius; y <= rp.y + radius; y++) {
        for (let x = rp.x - radius; x <= rp.x + radius; x++) {
          if (Math.max(Math.abs(x - rp.x), Math.abs(y - rp.y)) !== radius) continue
          if (x < 0 || y < 0 || x >= cols || y >= rows || (x + y) % 2) continue
          heat[y * cols + x] = Math.max(heat[y * cols + x], 0.95 - radius * 0.035)
        }
      }
    }
    ripples = ripples.filter((rp) => now - rp.at < 38 * 22)

    // sparks: notes leaving the bird's beak while you talk
    for (let s of sparks) {
      s.x += s.vx
      s.y += s.vy
      s.life--
      let x = Math.round(s.x / C)
      let y = Math.round(s.y / C)
      if (x >= 0 && y >= 0 && x < cols && y < rows) heat[y * cols + x] = Math.max(heat[y * cols + x], s.life / 40)
    }
    sparks = sparks.filter((s) => s.life > 0)

    for (let i = 0; i < heat.length; i++) {
      let h = heat[i]
      if (h < 0.1) continue
      square(i % cols, Math.floor(i / cols), h > 0.85 ? crest : h > 0.6 ? lit : h > 0.35 ? mid : dim)
      heat[i] = h * 0.93
    }
    flush(ctx)
  }

  /** The shape's turn around its vertical axis this frame. */
  function turn(f: Formation, now: number, dt: number, half: number, cx: number, cy: number) {
    let m = f.motion
    if (reduced || !m) return 0
    let held =
      m.holdOnTouch && pointer && Math.abs(pointer.x - cx) < half * f.cell && Math.abs(pointer.y - cy) < (f.size.h / 2) * f.cell
    let goal = held
      ? Math.round(f.angle / (2 * Math.PI)) * 2 * Math.PI
      : m.spin
        ? f.angle + m.spin * (dt / 1000)
        : (m.sway ?? 0) * Math.sin(now / 1400)
    f.angle += (goal - f.angle) * (m.spin && !held ? 1 : 0.08)
    return f.angle
  }

  /**
   * Each letter's band colors right now. The accent cycles while idle, and
   * each new color passes through the word left to right, like a voice.
   */
  function wordBands(now: number) {
    if (reduced) return Array.from(WORD, () => bands(palette, palette.sky))
    let phase = now / ACCENT_MS
    let i = Math.floor(phase)
    let a = palette[ACCENTS[i % ACCENTS.length]]
    let b = palette[ACCENTS[(i + 1) % ACCENTS.length]]
    // the pass takes the last quarter of each cycle: letters start 0.012
    // apart and take 0.125 each, so the last one (0.87) lands by 0.995
    return Array.from(WORD, (_, letter) => bands(palette, mix(a, b, clamp01((phase - i - 0.75 - letter * 0.012) * 8))))
  }

  function drawParticles(now: number, dt: number) {
    let f = formations.get(active)
    if (!f) return
    let r = f.anchor.getBoundingClientRect()
    let cx = r.left + r.width / 2
    let cy = r.top + r.height / 2
    let isWord = active === 'top'
    let wb = isWord ? wordBands(now) : null
    let pressed = recording && f.anchor.closest('#demo') ? 1 : 0
    let cell = f.cell
    let target = cell - f.gap
    let half = f.size.w / 2
    let a = turn(f, now, dt, half, cx, cy)
    let cos = Math.cos(a)
    let sin = Math.sin(a)
    // perspective distance, in cells
    let lens = f.size.w * 2.2
    let push = 6 * C
    // pixels behind the scene's text panel dim, so the text stays readable
    let panel = f.anchor.parentElement?.querySelector('.panel')?.getBoundingClientRect()
    for (let [letter, g] of glitches) if (g.until < now) glitches.delete(letter)

    particles.forEach((pt, i) => {
      let c = f.cells[i]
      let k = reduced ? 1 : easeOut(clamp01((now - morphAt - pt.delay) / MORPH_MS))
      let tx = pt.sx
      let ty = pt.sy
      let scale = 1
      let depth = 0
      if (c) {
        // turn the cell around the shape's vertical axis, then project
        let u = c.x - half
        let z = -u * sin
        scale = lens / (lens - z)
        tx = cx + u * cos * scale * cell
        ty = cy + (c.y - f.size.h / 2 + pressed * 0.5) * scale * cell
        depth = z < -half * 0.45 ? 3 : z < -half * 0.25 ? 2 : z < -half * 0.08 ? 1 : 0
      }
      let goal: RGB = palette.bg
      let dim = false
      if (c) {
        goal = wb && c.letter !== undefined ? wb[c.letter][c.group] : palette[c.role]
        dim = Boolean(highlight && c.group && f.anchor.closest('#how') && c.group !== highlight)
        if (pressed) goal = mix(goal, palette.crest, 0.35)
        if (!reduced && k === 1 && hash(c.x, c.y, Math.floor(now / 500)) > 0.985) goal = palette.crest
      }
      let color = k === 1 ? goal : mix(pt.from, goal, k)
      let swing = Math.sin(Math.PI * k) * pt.curl
      let x = lerp(pt.sx, tx, k) + swing
      let y = lerp(pt.sy, ty, k) - swing * 0.4

      // shy away from the pointer
      if (!reduced) {
        let ax = 0
        let ay = 0
        if (pointer && c) {
          let dx = x - pointer.x
          let dy = y - pointer.y
          let d = Math.hypot(dx, dy)
          if (d < push && d > 0) {
            ax = (dx / d) * (push - d) * 0.5
            ay = (dy / d) * (push - d) * 0.5
          }
        }
        pt.px += (ax - pt.px) * 0.2
        pt.py += (ay - pt.py) * 0.2
        x += pt.px
        y += pt.py
        // ride the wave field: slope moves the pixel, crests catch the light
        let gi = Math.floor(y / C) * cols + Math.floor(x / C)
        if (c && gi > cols && gi < wave.length - cols) {
          x += clamp(wave[gi + 1] - wave[gi - 1], 1.5) * cell
          y += clamp(wave[gi + cols] - wave[gi - cols], 1.5) * cell
          if (wave[gi] > 0.6) color = palette.crest
        }
      }

      let size = Math.max(1, Math.round(lerp(pt.fromSize, target * scale, k)))
      pt.x = x
      pt.y = y
      pt.color = color
      pt.size = size
      pt.spare = !c
      if (!c && k === 1) return

      if (c && 'letter' in c && c.letter !== undefined) {
        let g = glitches.get(c.letter)
        if (g && k === 1) {
          if (g.mode === 'dither' && (c.x + c.y) % 2) return
          if (g.mode === 'shift' && c.y >= g.row) x += g.dx * cell
          color = mix(color, palette.crest, 0.4)
        }
      }
      if (panel && x >= panel.left && x < panel.right && y >= panel.top && y < panel.bottom) dim = true
      paint(shade(color, depth, dim), Math.round(x), Math.round(y), size)
    })
  }

  // The bird sits above the wordmark in the hero, and flies into the nav's
  // home link as you scroll. The nav's own <img> takes over once it lands.
  function drawBird(now: number, p: number) {
    if (!bird || !birdSlot || !home || !homeImg) return
    let k = reduced ? (p < 0.5 ? 0 : 1) : easeInOut(clamp01(p / 0.85))
    home.style.opacity = k >= 1 ? '1' : '0'
    if (k >= 1) return

    let a = birdSlot.getBoundingClientRect()
    let b = homeImg.getBoundingClientRect()
    let s0 = C / 2
    let s1 = b.height / bird.h
    let s = lerp(s0, s1, k)
    // the hero scrolls away under it, so it keeps clear of the top edge,
    // then swoops down a little on its way to the nav
    let x = lerp(a.left + (a.width - bird.w * s0) / 2, b.left, k)
    let y = lerp(Math.max(a.top + (a.height - bird.h * s0) / 2, b.bottom + C), b.top, k) + Math.sin(Math.PI * k) * H * 0.08
    let g = s >= 3 ? gap / 2 : 0
    let intro = reduced ? 99 : (now - bootAt) / 1000

    // Wings: hold the logo's pose half a second, then one beat (four frames).
    // A click flutters: beats four times faster for 0.6s, with a hop.
    // Reduced motion holds still, mid-beat.
    let since = now - flutterAt
    let frame = reduced ? 1 : since < 600 ? Math.floor(since / 50) % 4 : now % 1000 < 500 ? 0 : Math.floor((now % 500) / 125)
    let cells = birdFrames[frame] ?? bird.cells
    y += LIFT[frame] * s - (since < 600 ? Math.sin((Math.PI * since) / 600) * 6 * s : 0)
    let flash = !reduced && since < 350
    birdBox = { x, y, w: bird.w * s, h: bird.h * s }

    // It notices you: the head tilts toward the pointer, and feathers near
    // it scatter and settle back.
    let headX = x + 31 * s
    let headY = y + 12 * s
    let near = !reduced && intro >= 1.6 && k < 0.2 && pointer && Math.hypot(pointer.x - headX, pointer.y - headY) < 320
    let hdx = near && pointer!.x > headX + 30 ? 1 : 0
    let hdy = near ? (pointer!.y < headY - 30 ? -1 : pointer!.y > headY + 30 ? 1 : 0) : 0
    let reach = 9 * s
    let nudge = (c: { x: number; y: number }, at: [number, number]): [number, number] => {
      let head = c.x >= 25 && c.y <= 16
      let px = at[0] + (head ? hdx * s : 0)
      let py = at[1] + (head ? hdy * s : 0)
      if (!near || !pointer) return [px, py]
      let dx = px - pointer.x
      let dy = py - pointer.y
      let d = Math.hypot(dx, dy)
      if (d >= reach || d === 0) return [px, py]
      let push = (1 - d / reach) * 2.5 * s * (0.6 + hash(c.x, c.y, 12))
      return [px + (dx / d) * push, py + (dy / d) * push]
    }

    // Where a bird pixel is drawn, streaming in from the upper right on load.
    let place = (c: { x: number; y: number }): [number, number] | null => {
      if (intro >= 1.6) return [x + c.x * s, y + c.y * s]
      let wait = c.x * 0.006 + hash(c.x, c.y, 7) * 0.25
      let q = easeOut(clamp01((intro - wait) / 0.7))
      if (q <= 0) return null
      return [x + (c.x + (1 - q) * (30 + hash(c.x, c.y, 8) * 70)) * s, y + (c.y - (1 - q) * (20 + hash(c.x, c.y, 9) * 50)) * s]
    }

    // In Latte the light facets vanish into the background, so a dark
    // one-pixel ring goes down first (issue #3), once the bird has streamed
    // in, so it never scatters away from it. Dark flavors don't need it.
    if (palette.light && intro >= 1.6) {
      let ring = css(mix(palette.text, palette.bg, 0.1))
      for (let c of birdRings[frame] ?? []) {
        let at = place(c)
        if (at) {
          let [px, py] = nudge(c, at)
          paint(ring, px, py, s)
        }
      }
    }
    for (let c of cells) {
      let at = place(c)
      if (!at) continue
      let [px, py] = nudge(c, at)
      let color = palette[c.role]
      if (flash && c.wing) color = palette.crest
      else if (!reduced && hash(c.x, c.y, Math.floor(now / 500)) > 0.985) color = palette.crest
      paint(css(color), px, py, s - g)
    }

    // feathers from a flutter, and the notes leaving the beak while you talk,
    // drawn on the glowing layer
    for (let fe of feathers) {
      fe.x += fe.vx + Math.sin(fe.life / 6) * 0.6
      fe.y += fe.vy
      fe.life--
      paint(css(mix(palette[fe.role], palette.bg, 1 - fe.life / 100)), fe.x, fe.y, s)
    }
    feathers = feathers.filter((fe) => fe.life > 0)
    for (let sp of sparks) paint(css(mix(palette.crest, palette.bg, 1 - sp.life / 50)), sp.x, sp.y, Math.max(2, Math.round(C * 0.6)))

    if (recording && k < 0.2 && Math.random() < 0.45) {
      sparks.push({
        x: x + bird.w * s,
        y: y + bird.h * s * 0.24,
        vx: (0.25 + Math.random() * 0.35) * C,
        vy: (-0.12 - Math.random() * 0.3) * C,
        life: 30 + Math.random() * 20,
      })
    }
  }

  function draw(now: number) {
    let dt = lastFrame ? Math.min(now - lastFrame, 100) : 16
    lastFrame = now
    ctx.clearRect(0, 0, W, H)
    fx.clearRect(0, 0, W, H)
    let p = heroProgress()
    let key = wanted(p)
    if (key !== active) morphTo(key, now)

    if (!reduced && active === 'top' && now - bootAt > 2000 && now > nextAutoGlitch) {
      startGlitch(now)
      nextAutoGlitch = now + 3500 + Math.random() * 4000
    }
    if (!reduced) stepWave()
    drawBackground(now, p)
    drawParticles(now, dt)
    drawBird(now, p)
    flush(fx)
    if (glowOn) {
      gx.clearRect(0, 0, glow.width, glow.height)
      gx.drawImage(fg, 0, 0, glow.width, glow.height)
      ctx.save()
      ctx.globalCompositeOperation = palette.light ? 'multiply' : 'lighter'
      ctx.globalAlpha = palette.light ? 0.45 : 0.9
      ctx.drawImage(glow, 0, 0, W, H)
      ctx.restore()
    }
    ctx.drawImage(fg, 0, 0, W, H)
  }

  function frame(now: number) {
    if (!running || signal.aborted) return
    level += (target - level) * (target > level ? 0.18 : 0.06)
    // If frames run slow for ~1.5s, drop the glow; if still slow, use fewer pixels.
    // clamped, so the gap after a hidden tab comes back is not a slow frame
    if (lastFrame) frameMs = frameMs * 0.95 + Math.min(now - lastFrame, 50) * 0.05
    slowFrames = frameMs > 22 ? slowFrames + 1 : 0
    if (slowFrames > 90 && glowOn) {
      glowOn = false
      slowFrames = 0
    } else if (slowFrames > 90 && density === 1) {
      density = 0.6
      slowFrames = 0
      buildFormations()
    }
    draw(now)
    requestAnimationFrame(frame)
  }

  // With reduced motion nothing animates: the canvas redraws only when you
  // scroll, resize or change the flavor.
  function requestDraw() {
    if (running || drawQueued) return
    drawQueued = true
    requestAnimationFrame((now) => {
      drawQueued = false
      draw(now)
    })
  }

  window.addEventListener('scroll', requestDraw, { passive: true, signal })
  window.addEventListener('resize', resize, { signal })
  signal.addEventListener('abort', () => (running = false))

  onTheme(() => {
    palette = readPalette()
    strings.clear()
    shades.clear()
    requestDraw()
  }, signal)
  onTalk((state) => {
    recording = state === 'listening'
    target = recording ? 1 : 0
    if (reduced) {
      level = target
      requestDraw()
    }
  }, signal)

  async function boot() {
    await loadShapeFonts()
    if (signal.aborted) return
    if (logo) {
      bird = sampleLogo(logo, 40)
      birdFrames = FLAP.map((deg, i) => flapFrame(bird!.cells, deg, i === 2 ? 0.9 : 1))
      birdRings = birdFrames.map((cells) => outline(cells))
    }
    resize()
    bootAt = performance.now()
    if (reduced) return requestDraw()
    intro(bootAt)
    running = true
    requestAnimationFrame(frame)
  }

  if (birdSrc) {
    let img = new Image()
    img.onload = () => {
      logo = img
      boot()
    }
    img.onerror = () => boot()
    img.src = birdSrc
  } else {
    boot()
  }
}
