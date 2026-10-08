// The shapes the pixel field's "transition element" re-forms into, one per
// scene. Each is drawn once on a tiny offscreen canvas, one canvas pixel per
// grid cell, and read back as cells. Most are Nerd Font icons.

import type { Role } from './palette.ts'

export interface Cell {
  x: number
  y: number
  role: Role
  /** shapes with parts number them from 1 (the pipeline's four stages) */
  group: number
}

export const FONT = '"JetBrains Mono Nerd", "JetBrains Mono Nerd Icons"'

// Nerd Font (Font Awesome / Octicons) code points
const ICON = {
  mic: '\uf130',
  words: '\uf075',
  magic: '\uf0d0',
  cursor: '\uf246',
  terminal: '\uf489',
  lock: '\uf023',
  heart: '\uf004',
}

/** Resolves once the shapes' glyphs can be drawn on a canvas. */
export function loadShapeFonts(): Promise<unknown> {
  return Promise.all([
    document.fonts.load(`800 40px ${FONT}`, 'fn'),
    document.fonts.load(`40px ${FONT}`, Object.values(ICON).join('')),
  ]).catch(() => {})
}

type Draw = (ctx: CanvasRenderingContext2D, size: number) => void
interface Layer {
  role: Role
  group?: number
  draw: Draw
}

function rasterize(size: number, layers: Layer[]): Cell[] {
  let canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  let ctx = canvas.getContext('2d', { willReadFrequently: true })!
  let cells = new Map<number, Cell>()
  for (let layer of layers) {
    ctx.clearRect(0, 0, size, size)
    ctx.fillStyle = ctx.strokeStyle = '#fff'
    layer.draw(ctx, size)
    let alpha = ctx.getImageData(0, 0, size, size).data
    for (let i = 0; i < size * size; i++) {
      if (alpha[i * 4 + 3] > 110) cells.set(i, { x: i % size, y: Math.floor(i / size), role: layer.role, group: layer.group ?? 0 })
    }
  }
  return [...cells.values()]
}

/** Draws `text` with its ink centered on (cx, cy), scaled to fit a `box`-sized square. */
function glyph(ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number, box: number, weight = 400) {
  ctx.font = `${weight} 100px ${FONT}`
  let m = ctx.measureText(text)
  let w = m.actualBoundingBoxLeft + m.actualBoundingBoxRight
  let h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent
  let s = box / Math.max(w, h, 1)
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(s, s)
  ctx.fillText(text, (m.actualBoundingBoxLeft - m.actualBoundingBoxRight) / 2, (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2)
  ctx.restore()
}

const icon = (code: string, role: Role, scale = 0.86): Layer => ({
  role,
  draw: (ctx, s) => glyph(ctx, code, s / 2, s / 2, s * scale),
})

/** Sorts a pixel of the logo into one of the bird's facet colors, by hue. */
function birdRole(r: number, g: number, b: number): Role {
  r /= 255
  g /= 255
  b /= 255
  let max = Math.max(r, g, b)
  let min = Math.min(r, g, b)
  let l = (max + min) / 2
  let hue = 0
  if (max !== min) {
    let d = max - min
    hue = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
    hue = (hue * 60 + 360) % 360
  }
  return hue > 245 && hue < 320 ? 'mauve' : hue > 205 ? 'blue' : l > 0.62 ? 'sky' : l > 0.45 ? 'teal' : 'tealDeep'
}

/** The logo downsampled to `w` cells wide, so it recolors with the flavor. */
export function sampleLogo(img: HTMLImageElement, w: number): { w: number; h: number; cells: Cell[] } {
  let h = Math.round((w * img.naturalHeight) / img.naturalWidth)
  let canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  let ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0, w, h)
  let data = ctx.getImageData(0, 0, w, h).data
  let cells: Cell[] = []
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let i = (y * w + x) * 4
      if (data[i + 3] >= 120) cells.push({ x, y, role: birdRole(data[i], data[i + 1], data[i + 2]), group: 0 })
    }
  }
  return { w, h, cells }
}

/**
 * How a scene's shape moves in 3D: `sway` turns it back and forth around its
 * vertical axis (radians), `spin` turns it continuously (radians a second),
 * and `holdOnTouch` eases it to face you while the pointer is over it.
 */
export interface Motion {
  sway?: number
  spin?: number
  holdOnTouch?: boolean
}

/** What a shape does unless MOTION says otherwise: sway, and face you when touched. */
export const SWAY: Motion = { sway: 0.22, holdOnTouch: true }

/** Each shape's own motion, set as the sections get their redesigns. */
export const MOTION: Record<string, Motion> = {}

/**
 * Each section's world, by its shape: how its ambient pixels move.
 * flock drifts across in formation, rise floats up (dust, embers), orbit
 * circles the middle, fall rains down like a scrolling log, motes drift out
 * and get pulled back (nothing leaves), rush streams out to the sides.
 */
export type Ambient = 'flock' | 'rise' | 'orbit' | 'fall' | 'motes' | 'rush'

export const AMBIENT: Record<string, Ambient> = {
  bird: 'flock',
  fn: 'rise',
  pipeline: 'orbit',
  terminal: 'fall',
  lock: 'motes',
  road: 'rush',
  heart: 'rise',
}

/** The one-cell ring around a shape: every empty cell touching it, diagonals included. */
export function outline(cells: { x: number; y: number }[]): { x: number; y: number }[] {
  let key = (x: number, y: number) => `${x},${y}`
  let filled = new Set(cells.map((c) => key(c.x, c.y)))
  let ring = new Map<string, { x: number; y: number }>()
  for (let c of cells) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        let k = key(c.x + dx, c.y + dy)
        if (!filled.has(k)) ring.set(k, { x: c.x + dx, y: c.y + dy })
      }
    }
  }
  return [...ring.values()]
}

/** Cells of the shape called `name`, fitted to a `size`-cell square. */
export function buildShape(name: string, size: number, logo: HTMLImageElement | null): Cell[] {
  switch (name) {
    case 'bird': {
      if (!logo) return []
      let s = sampleLogo(logo, Math.round(size * 0.68))
      let ox = Math.round((size - s.w) / 2)
      let oy = Math.round((size - s.h) / 2)
      return s.cells.map((c) => ({ ...c, x: c.x + ox, y: c.y + oy }))
    }
    case 'fn':
      return rasterize(size, [
        {
          role: 'lavender',
          draw: (ctx, s) => {
            ctx.lineWidth = Math.max(2, Math.round(s * 0.07))
            ctx.beginPath()
            ctx.roundRect(s * 0.1, s * 0.16, s * 0.8, s * 0.68, s * 0.1)
            ctx.stroke()
          },
        },
        { role: 'sky', draw: (ctx, s) => glyph(ctx, 'fn', s / 2, s * 0.48, s * 0.42, 800) },
      ])
    case 'pipeline': {
      // listen → hear → tidy → type, around a square
      let q = (code: string, role: Role, group: number, col: number, row: number): Layer => ({
        role,
        group,
        draw: (ctx, s) => glyph(ctx, code, s * (0.22 + col * 0.56), s * (0.22 + row * 0.56), s * 0.36),
      })
      return rasterize(size, [
        {
          role: 'mid',
          draw: (ctx, s) => {
            let t = Math.max(1, Math.round(s * 0.03))
            ctx.fillRect(s * 0.44, s * 0.22 - t / 2, s * 0.12, t)
            ctx.fillRect(s * 0.78 - t / 2, s * 0.44, t, s * 0.12)
            ctx.fillRect(s * 0.44, s * 0.78 - t / 2, s * 0.12, t)
          },
        },
        q(ICON.mic, 'teal', 1, 0, 0),
        q(ICON.words, 'sky', 2, 1, 0),
        q(ICON.magic, 'mauve', 3, 1, 1),
        q(ICON.cursor, 'peach', 4, 0, 1),
      ])
    }
    case 'terminal':
      return rasterize(size, [icon(ICON.terminal, 'green')])
    case 'lock':
      return rasterize(size, [icon(ICON.lock, 'yellow', 0.8)])
    case 'road': {
      // a road running off to the horizon: edges converging, the center dashed
      let edge = (ctx: CanvasRenderingContext2D, s: number, from: number, to: number) => {
        ctx.lineWidth = Math.max(1, s * 0.035)
        ctx.beginPath()
        ctx.moveTo(s * from, s)
        ctx.lineTo(s * to, s * 0.18)
        ctx.stroke()
      }
      return rasterize(size, [
        {
          role: 'blue',
          draw: (ctx, s) => {
            edge(ctx, s, 0.02, 0.44)
            edge(ctx, s, 0.98, 0.56)
          },
        },
        {
          role: 'yellow',
          // dashes shrink toward the horizon
          draw: (ctx, s) => {
            for (let y = s, h = s * 0.13; y > s * 0.24; y -= h * 1.9, h *= 0.72) ctx.fillRect(s * 0.5 - h / 4, y - h, h / 2, h)
          },
        },
      ])
    }
    case 'heart':
      return rasterize(size, [icon(ICON.heart, 'red', 0.8)])
    default:
      return []
  }
}
