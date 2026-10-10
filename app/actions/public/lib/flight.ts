// The last scene: fly the pixel bird yourself, seen from behind, over the
// road. Nothing is captured until you take off (the button, or Space/Enter
// with the scene in view). Esc, scrolling up or the land button give the page
// back. F stays "hold to talk".
//
// This file owns the input and the motion; the pixel field draws it.

import type { Role } from './palette.ts'

// The bird from behind, wings up, level and down. h head, t back,
// b and s the wings, m the tail.
const BACK = [
  [
    's.......................s',
    'ss.....................ss',
    '.ss.........h.........ss.',
    '..sbb......hhh......bbs..',
    '...bbb....tbtbt....bbb...',
    '....bbbb..tbbbt..bbbb....',
    '......bbbbbbbbbbbbb......',
    '...........ttt...........',
    '..........mm.mm..........',
  ],
  [
    '............h............',
    '...........hhh...........',
    '..........tbtbt..........',
    'ssbbbbbbbbbbbbbbbbbbbbbss',
    '.sssbbbbbbbbtbbbbbbbbsss.',
    '.......bbbbbtbbbbb.......',
    '...........ttt...........',
    '..........mm.mm..........',
  ],
  [
    '...........hhh...........',
    '..........tbtbt..........',
    '.........bbbbbbb.........',
    '.......bbbbbbbbbbb.......',
    '.....bbbb.tbbbt.bbbb.....',
    '...bbb.....ttt.....bbb...',
    '..ss.......mmm.......ss..',
    '.ss.........m.........ss.',
    's.......................s',
  ],
]
const ROLES: Record<string, Role> = { h: 'tealDeep', t: 'teal', b: 'blue', s: 'sky', m: 'mauve' }

/** Each back-view frame as cells, centered on the bird's middle. */
export const BACK_FRAMES = BACK.map((rows) =>
  rows.flatMap((row, y) =>
    [...row].flatMap((ch, x) => (ROLES[ch] ? [{ x: x - 12, y: y - Math.floor(rows.length / 2), role: ROLES[ch] }] : [])),
  ),
)

/** A pixel ♪, 5 by 6. */
export const NOTE = ['..##.', '..#.#', '..#..', '..#..', '###..', '###..'].flatMap((row, y) =>
  [...row].flatMap((ch, x) => (ch === '#' ? [{ x, y }] : [])),
)

export interface Note {
  /** across the road, -1 to 1 */
  nx: number
  /** how high on screen it ends up, as a share of the height */
  ny: number
  /** 0 at the horizon, 1 at the bird */
  p: number
  hitAt: number
}

export interface Flight {
  on: boolean
  x: number
  y: number
  vx: number
  vy: number
  flapAt: number
  trail: { x: number; y: number }[]
  notes: Note[]
  count: number
  /** steps one frame; `w` and `h` are the viewport */
  step(now: number, dt: number, w: number, h: number): void
}

const STEER = new Map([
  ['arrowleft', 'l'], ['a', 'l'], ['arrowright', 'r'], ['d', 'r'],
  ['arrowup', 'u'], ['w', 'u'], ['arrowdown', 'd'], ['s', 'd'],
])

const newNote = (p = 0): Note => ({ nx: Math.random() * 1.6 - 0.8, ny: 0.25 + Math.random() * 0.55, p, hitAt: -1e9 })

export function createFlight(onChange: (on: boolean) => void, signal: AbortSignal): Flight {
  let section = document.getElementById('fly')
  let hud = document.getElementById('fly-hud')
  let held = new Set<string>()
  let target: { x: number; y: number } | null = null
  let tap = { at: 0, x: 0, y: 0 }
  let root = document.documentElement

  let flight: Flight = {
    on: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    flapAt: -1e9,
    trail: [],
    notes: [],
    count: 0,
    step,
  }

  function start() {
    if (flight.on || !section) return
    section.scrollIntoView({ block: 'start', behavior: 'instant' })
    Object.assign(flight, { on: true, x: innerWidth / 2, y: innerHeight * 0.62, vx: 0, vy: 0, trail: [], count: 0 })
    flight.notes = Array.from({ length: 6 }, (_, i) => newNote(i / 6))
    root.dataset.flying = ''
    if (hud) hud.hidden = false
    hud?.querySelector('button')?.focus()
    count()
    onChange(true)
  }

  function stop() {
    if (!flight.on) return
    flight.on = false
    held.clear()
    target = null
    delete root.dataset.flying
    if (hud) hud.hidden = true
    section?.querySelector<HTMLElement>('[data-fly]')?.focus()
    onChange(false)
  }

  function flap(now: number) {
    flight.vy -= 7
    flight.flapAt = now
  }

  function count() {
    let out = hud?.querySelector('output')
    if (out) out.textContent = String(flight.count)
  }

  function inView() {
    let r = section?.getBoundingClientRect()
    return Boolean(r && r.top < innerHeight * 0.45 && r.bottom > innerHeight * 0.55)
  }

  function step(now: number, dt: number, w: number, h: number) {
    let f = dt / 16
    if (target) {
      // the pointer leads: ease toward it
      let nx = flight.x + (target.x - flight.x) * 0.08 * f
      let ny = flight.y + (target.y - flight.y) * 0.08 * f
      flight.vx = (nx - flight.x) / f
      flight.vy = (ny - flight.y) / f
    } else {
      let ax = (held.has('r') ? 1 : 0) - (held.has('l') ? 1 : 0)
      let ay = (held.has('d') ? 1 : 0) - (held.has('u') ? 1 : 0)
      flight.vx = (flight.vx + ax * 1.2 * f) * 0.9 ** f
      flight.vy = (flight.vy + (ay * 0.9 + 0.15) * f) * 0.92 ** f
    }
    flight.x = Math.min(w * 0.92, Math.max(w * 0.08, flight.x + flight.vx * f))
    flight.y = Math.min(h * 0.88, Math.max(h * 0.18, flight.y + flight.vy * f))
    flight.trail.unshift({ x: flight.x, y: flight.y })
    flight.trail.length = Math.min(flight.trail.length, 16)
    for (let n of flight.notes) {
      n.p += dt / 2600
      if (n.p > 1.05) Object.assign(n, newNote())
      let sx = w / 2 + n.nx * (w / 2) * n.p
      let sy = h * 0.4 + (n.ny * h - h * 0.4) * n.p
      if (n.p > 0.85 && now - n.hitAt > 1000 && Math.hypot(sx - flight.x, sy - flight.y) < w * 0.05) {
        n.hitAt = now
        flight.count++
        count()
      }
    }
  }

  window.addEventListener(
    'keydown',
    (e) => {
      let key = e.key.toLowerCase()
      if (!flight.on) {
        // Space or Enter take off, unless they belong to a focused control
        if ((key === ' ' || key === 'enter') && inView() && !(e.target instanceof Element && e.target.closest('a, button, input, select, textarea'))) {
          e.preventDefault()
          start()
        }
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return
      let dir = STEER.get(key)
      if (key === 'escape') stop()
      else if (key === ' ') {
        if (!e.repeat) flap(performance.now())
      } else if (dir) {
        held.add(dir)
        target = null
      } else return
      // the page's own arrow-key and letter shortcuts wait until you land
      e.preventDefault()
      e.stopImmediatePropagation()
    },
    { capture: true, signal },
  )
  window.addEventListener('keyup', (e) => held.delete(STEER.get(e.key.toLowerCase()) ?? ''), { signal })
  window.addEventListener('blur', () => held.clear(), { signal })
  window.addEventListener('wheel', (e) => flight.on && e.deltaY < 0 && stop(), { passive: true, signal })
  window.addEventListener(
    'pointermove',
    (e) => {
      if (flight.on && (e.pointerType === 'mouse' || e.buttons)) target = { x: e.clientX, y: e.clientY }
    },
    { signal },
  )
  window.addEventListener(
    'pointerdown',
    (e) => {
      if (!flight.on || (e.target instanceof Element && e.target.closest('button'))) return
      tap = { at: performance.now(), x: e.clientX, y: e.clientY }
      if (e.pointerType !== 'mouse') target = { x: e.clientX, y: e.clientY }
    },
    { signal },
  )
  window.addEventListener(
    'pointerup',
    (e) => {
      if (!flight.on) return
      let now = performance.now()
      // a quick tap flaps; a mouse click flaps too
      if (now - tap.at < 250 && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < 12) flap(now)
      if (e.pointerType !== 'mouse') target = null
    },
    { signal },
  )
  document.addEventListener(
    'click',
    (e) => {
      if (!(e.target instanceof Element)) return
      if (e.target.closest('[data-fly]')) start()
      else if (e.target.closest('[data-land]')) stop()
    },
    { signal },
  )
  signal.addEventListener('abort', stop)

  return flight
}
