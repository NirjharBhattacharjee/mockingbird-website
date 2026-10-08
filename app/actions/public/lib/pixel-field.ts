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

import { currentSceneIndex, onTalk, onTheme, prefersReducedMotion, scenes } from './events.ts'
import { type Palette, type RGB, bands, mix, readPalette, rgb } from './palette.ts'
import { FONT_ROWS, layout, measure } from './pixel-font.ts'
import { type Cell, buildShape, loadShapeFonts, sampleLogo } from './shapes.ts'

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
  anchor: HTMLElement
}

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
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Grid cell size in px, chosen so the wordmark fits the viewport. */
function cellSize(): number {
  let vw = Math.min(window.innerWidth, 1280)
  return Math.max(4, Math.min(10, Math.floor((vw - 40) / (WORD_COLS + 4))))
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

  let hero = document.getElementById('top')
  let wordSlot = document.getElementById('wordmark-slot')
  let birdSlot = document.getElementById('bird-slot')
  let home = document.getElementById('home-slot')
  let homeImg = home?.querySelector('img') ?? null
  let sceneList = scenes()

  let W = 0
  let H = 0
  let C = 10
  let gap = 2
  let cols = 0
  let rows = 0
  let palette: Palette = readPalette()
  let logo: HTMLImageElement | null = null
  let bird: ReturnType<typeof sampleLogo> | null = null

  let formations = new Map<string, Formation>()
  let particles: Particle[] = []
  let active = ''
  let morphAt = 0
  // the pipeline stage the "how it works" tabs point at (Listen starts checked)
  let highlight = 1
  let pointer: { x: number; y: number } | null = null

  let heat = new Float32Array(0)
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
      formations.set('top', { cells, size: { w: WORD_COLS, h: FONT_ROWS }, anchor: wordSlot })
    }
    for (let scene of sceneList) {
      let stage = scene.querySelector<HTMLElement>('[data-stage]')
      let shape = scene.dataset.shape
      if (!stage || !shape) continue
      let r = stage.getBoundingClientRect()
      let size = Math.max(8, Math.floor((Math.min(r.width, r.height) * 0.9) / C))
      let cells = buildShape(shape, size, logo)
      // shuffle, so a morph sends pixels criss-crossing like a flock
      cells.sort((a, b) => hash(a.x, a.y, 11) - hash(b.x, b.y, 11))
      formations.set(scene.id, { cells, size: { w: size, h: size }, anchor: stage })
    }
    let need = Math.max(0, ...[...formations.values()].map((f) => f.cells.length))
    while (particles.length < need) {
      let i = particles.length
      particles.push({ x: -C, y: -C, sx: -C, sy: -C, from: palette.bg, color: palette.bg, delay: 0, curl: (hash(i, 1, 2) - 0.5) * 160, px: 0, py: 0, spare: true })
    }
  }

  function origin(f: Formation) {
    let r = f.anchor.getBoundingClientRect()
    return { x: Math.round(r.left + (r.width - f.size.w * C) / 2), y: Math.round(r.top + (r.height - f.size.h * C) / 2) }
  }

  function resize() {
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    C = cellSize()
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
    heat = new Float32Array(cols * rows)
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
        pt.x = o.x + hash(i, 3) * old.size.w * C
        pt.y = o.y + hash(i, 4) * old.size.h * C
      }
      pt.sx = pt.x
      pt.sy = pt.y
      pt.from = pt.color
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
      pt.sx = o.x + (c.x + 20 + hash(c.x, c.y, 6) * 40) * C
      pt.sy = o.y + (c.y - 8 - hash(c.x, c.y, 1) * 30) * C
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
    return x >= o.x && y >= o.y && x < o.x + f.size.w * C && y < o.y + f.size.h * C
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
        warm(Math.floor(e.clientX / C), Math.floor(e.clientY / C), Math.max(4, Math.round(56 / C)), 0.6)
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

  function square(x: number, y: number, color: string) {
    ctx.fillStyle = color
    ctx.fillRect(x * C, y * C, C - gap, C - gap)
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

    if (reduced) return
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
    // the pass takes the last quarter of each cycle, letters 0.015 apart
    return Array.from(WORD, (_, letter) => bands(palette, mix(a, b, clamp01((phase - i - 0.75 - letter * 0.015) * 8))))
  }

  function drawParticles(now: number) {
    let f = formations.get(active)
    if (!f) return
    let o = origin(f)
    let isWord = active === 'top'
    let wb = isWord ? wordBands(now) : null
    let pressed = recording && f.anchor.closest('#demo') ? 1 : 0
    let size = isWord ? C : C - gap
    let push = 6 * C
    for (let [letter, g] of glitches) if (g.until < now) glitches.delete(letter)

    particles.forEach((pt, i) => {
      let c = f.cells[i]
      let k = reduced ? 1 : easeOut(clamp01((now - morphAt - pt.delay) / MORPH_MS))
      let tx = c ? o.x + c.x * C : pt.sx
      let ty = c ? o.y + (c.y + pressed * 0.5) * C : pt.sy
      let goal: RGB = palette.bg
      if (c) {
        goal = wb && c.letter !== undefined ? wb[c.letter][c.group] : palette[c.role]
        if (highlight && c.group && f.anchor.closest('#how') && c.group !== highlight) goal = mix(goal, palette.bg, 0.6)
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
      }

      pt.x = x
      pt.y = y
      pt.color = color
      pt.spare = !c
      if (!c && k === 1) return

      if (c && 'letter' in c && c.letter !== undefined) {
        let g = glitches.get(c.letter)
        if (g && k === 1) {
          if (g.mode === 'dither' && (c.x + c.y) % 2) return
          if (g.mode === 'shift' && c.y >= g.row) x += g.dx * C
          color = mix(color, palette.crest, 0.4)
        }
      }
      ctx.fillStyle = rgb(color)
      ctx.fillRect(Math.round(x), Math.round(y), size, size)
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

    for (let c of bird.cells) {
      let cx = c.x
      let cy = c.y
      if (intro < 1.6) {
        let wait = c.x * 0.006 + hash(c.x, c.y, 7) * 0.25
        let q = easeOut(clamp01((intro - wait) / 0.7))
        if (q <= 0) continue
        cx += (1 - q) * (30 + hash(c.x, c.y, 8) * 70)
        cy -= (1 - q) * (20 + hash(c.x, c.y, 9) * 50)
      }
      let color = palette[c.role]
      if (!reduced && hash(c.x, c.y, Math.floor(now / 500)) > 0.985) color = palette.crest
      ctx.fillStyle = rgb(color)
      ctx.fillRect(x + cx * s, y + cy * s, s - g, s - g)
    }

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
    ctx.clearRect(0, 0, W, H)
    let p = heroProgress()
    let key = wanted(p)
    if (key !== active) morphTo(key, now)

    if (!reduced && active === 'top' && now - bootAt > 2000 && now > nextAutoGlitch) {
      startGlitch(now)
      nextAutoGlitch = now + 3500 + Math.random() * 4000
    }
    drawBackground(now, p)
    drawParticles(now)
    drawBird(now, p)
  }

  function frame(now: number) {
    if (!running || signal.aborted) return
    level += (target - level) * (target > level ? 0.18 : 0.06)
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
    if (logo) bird = sampleLogo(logo, 40)
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
