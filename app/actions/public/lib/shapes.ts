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
  /** depth in cells, toward the viewer; flat shapes leave it out */
  z?: number
  /** on a ring around the middle: it orbits there, always facing you */
  ring?: { radius: number; angle: number }
}

export const FONT = '"JetBrains Mono Nerd", "JetBrains Mono Nerd Icons"'

// Nerd Font (Font Awesome / Octicons) code points
const ICON = {
  mic: '\uf130',
  globe: '\uf0ac',
  words: '\uf075',
  magic: '\uf0d0',
  cursor: '\uf246',
  terminal: '\uf489',
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
  /** a fixed lean toward you around the horizontal axis, radians */
  tilt?: number
  /** radians a second the ring cells orbit at */
  orbit?: number
}

/** What a shape does unless MOTION says otherwise: sway, and face you when touched. */
export const SWAY: Motion = { sway: 0.22, holdOnTouch: true }

/** Each shape's own motion, set as the sections get their redesigns. */
export const MOTION: Record<string, Motion> = {
  // the Fn key turns on its own, leans so you see its top, and holds still
  // facing you while you touch it
  fn: { spin: 0.35, tilt: 0.26, holdOnTouch: true },
  // the bird in the middle sways; the four stages orbit it once every 24s
  pipeline: { sway: 0.6, tilt: 0.55, orbit: (2 * Math.PI) / 24 },
  // the lock turns like the Fn key, and holds still when touched
  lock: { spin: 0.35, tilt: 0.26, holdOnTouch: true },
}

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

/** The pipeline ring's radius, as a share of the shape: wide enough to clear the panel. */
export const RING = 0.62

/** Gives a flat shape thickness: its face in front, its border repeated back as walls. */
export function extrude(face: Cell[], depth: number, step = 2): Cell[] {
  let cells: Cell[] = face.map((c) => ({ ...c, z: depth / 2 }))
  for (let z = -depth / 2; z < depth / 2; z += step) for (let c of edge(face)) cells.push({ ...c, z })
  return cells
}

/** The cells on a shape's own border: the ones with an empty neighbor. */
function edge(cells: Cell[]): Cell[] {
  let filled = new Set(cells.map((c) => `${c.x},${c.y}`))
  return cells.filter((c) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !filled.has(`${c.x + dx},${c.y + dy}`)))
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
    case 'fn': {
      // A keycap like the Mac's: "fn" top right, a globe bottom left, on a
      // rounded cap with real thickness (its rim extruded back into walls).
      let cap = (ctx: CanvasRenderingContext2D, s: number) => {
        ctx.beginPath()
        ctx.roundRect(s * 0.12, s * 0.12, s * 0.76, s * 0.76, s * 0.12)
      }
      let face = rasterize(size, [
        {
          role: 'lavender',
          draw: (ctx, s) => {
            ctx.lineWidth = Math.max(2, Math.round(s * 0.05))
            cap(ctx, s)
            ctx.stroke()
          },
        },
        { role: 'sky', draw: (ctx, s) => glyph(ctx, 'fn', s * 0.6, s * 0.34, s * 0.28, 800) },
        { role: 'sky', draw: (ctx, s) => glyph(ctx, ICON.globe, s * 0.33, s * 0.66, s * 0.22) },
      ])
      let walls = edge(rasterize(size, [{ role: 'blue', draw: (ctx, s) => (cap(ctx, s), ctx.fill()) }]))
      let depth = Math.max(4, Math.round(size * 0.1))
      let cells: Cell[] = face.map((c) => ({ ...c, z: depth / 2 }))
      for (let z = -depth / 2; z < depth / 2; z += 2) for (let c of walls) cells.push({ ...c, z })
      return cells
    }
    case 'pipeline': {
      // A solid pixel mockingbird in the middle, and listen → hear → tidy →
      // type on a ring around it, joined by a dotted orbit.
      let mid = size / 2
      let b = logo ? sampleLogo(logo, Math.round(size * 0.4)) : null
      let bird = b
        ? extrude(b.cells.map((c) => ({ ...c, x: c.x + Math.round(mid - b.w / 2), y: c.y + Math.round(mid - b.h / 2) })), 4)
        : []
      let radius = size * RING
      let span = Math.round(size * 0.2)
      let stages: [string, Role][] = [
        [ICON.mic, 'teal'],
        [ICON.words, 'sky'],
        [ICON.magic, 'mauve'],
        [ICON.cursor, 'peach'],
      ]
      let icons = stages.flatMap(([code, role], i) =>
        rasterize(span, [{ role, group: i + 1, draw: (ctx, s) => glyph(ctx, code, s / 2, s / 2, s * 0.9) }]).map((c) => ({
          ...c,
          x: c.x + mid - span / 2,
          y: c.y + mid - span / 2,
          ring: { radius, angle: (i * Math.PI) / 2 },
        })),
      )
      let path: Cell[] = Array.from({ length: 96 }, (_, i) => ({
        x: mid,
        y: mid,
        role: 'mid',
        group: 0,
        ring: { radius, angle: (i * 2 * Math.PI) / 96 },
      }))
      return [...bird, ...icons, ...path]
    }
    case 'terminal':
      return rasterize(size, [icon(ICON.terminal, 'green')])
    case 'lock': {
      // A padlock: a riveted body with a keyhole shaped like the bird, and a
      // shackle (group 1, so it can lift) with a peach highlight down one side.
      let shackle = (ctx: CanvasRenderingContext2D, s: number, r: number) => {
        ctx.beginPath()
        ctx.moveTo(s * 0.5 - r, s * 0.5)
        ctx.arc(s * 0.5, s * 0.3, r, Math.PI, 0)
        ctx.lineTo(s * 0.5 + r, s * 0.5)
      }
      let face = rasterize(size, [
        {
          role: 'yellow',
          group: 1,
          draw: (ctx, s) => {
            ctx.lineWidth = s * 0.075
            shackle(ctx, s, s * 0.22)
            ctx.stroke()
          },
        },
        {
          role: 'peach',
          group: 1,
          draw: (ctx, s) => {
            ctx.lineWidth = s * 0.018
            ctx.beginPath()
            ctx.moveTo(s * 0.25, s * 0.5)
            ctx.arc(s * 0.5, s * 0.3, s * 0.25, Math.PI, Math.PI * 1.45)
            ctx.stroke()
          },
        },
        {
          role: 'yellow',
          draw: (ctx, s) => {
            ctx.beginPath()
            ctx.roundRect(s * 0.16, s * 0.46, s * 0.68, s * 0.44, s * 0.06)
            ctx.fill()
            // the keyhole: the bird cut out of the body, or a classic one
            ctx.globalCompositeOperation = 'destination-out'
            let k = s * 0.17
            if (logo) ctx.drawImage(logo, s * 0.5 - k / 2, s * 0.68 - k / 2, k, (k * logo.naturalHeight) / logo.naturalWidth)
            else {
              ctx.beginPath()
              ctx.arc(s * 0.5, s * 0.64, s * 0.04, 0, Math.PI * 2)
              ctx.rect(s * 0.485, s * 0.64, s * 0.03, s * 0.12)
              ctx.fill()
            }
            ctx.globalCompositeOperation = 'source-over'
          },
        },
        {
          role: 'peach',
          draw: (ctx, s) => {
            for (let [x, y] of [[0.22, 0.52], [0.78, 0.52], [0.22, 0.84], [0.78, 0.84]]) ctx.fillRect(s * (x - 0.015), s * (y - 0.015), s * 0.03, s * 0.03)
          },
        },
      ])
      return extrude(face, Math.max(4, Math.round(size * 0.08)))
    }
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
