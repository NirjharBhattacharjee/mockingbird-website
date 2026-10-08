// The pixel bird's wing flap, made from the logo itself: the wing pixels
// (everything up and left of the shoulder) turn around the shoulder joint,
// read back through the inverse rotation so the turned wing has no holes.
// At 40 cells wide the logo's shoulder sits at (21, 15).

export interface BirdCell<R> {
  x: number
  y: number
  role: R
  /** part of a wing, so it can flash when the bird flutters */
  wing?: boolean
}

const SHOULDER = { x: 21, y: 15 }
const isWing = (x: number, y: number) => y <= SHOULDER.y && x <= SHOULDER.x + 3

/** Wing angles for each frame, in degrees: up, mid, down, mid. */
export const FLAP = [0, 38, 72, 38]
/** How far the body lifts on each frame, in bird cells: the downstroke lifts it. */
export const LIFT = [0, 0, -1, 0]

const clamp01 = (t: number) => Math.min(1, Math.max(0, t))
const easeIn = (t: number) => t * t * t

export interface DivePose {
  /** cells, negative is up: the little lift before the dive */
  lift: number
  /** wing angle, degrees: 0 is the logo's pose, 110 folded along the body */
  wings: number
  /** degrees nose-down */
  pitch: number
  /** 0 at the perch, 1 at the next section's stage */
  travel: number
  visible: boolean
}

/**
 * The bird's dive out of the hero as a pure function of scroll progress `p`
 * (0 at the top, 1 once the hero has scrolled by): it lifts, folds its
 * wings, tips nose-down and drops into the next section. No state, so
 * scrolling back up plays it in reverse.
 */
export function divePose(p: number): DivePose {
  let lift = p < 0.08 ? -2 * (p / 0.08) : -2 * (1 - clamp01((p - 0.08) / 0.2))
  return {
    lift,
    wings: 110 * clamp01((p - 0.08) / 0.2),
    pitch: 55 * easeIn(clamp01((p - 0.08) / 0.3)),
    travel: easeIn(clamp01((p - 0.12) / 0.48)),
    visible: p < 0.62,
  }
}

/** The whole bird turned `degrees` clockwise (nose down) around its middle. */
export function turnBird<R>(cells: BirdCell<R>[], degrees: number, center = { x: 20, y: 25 }): BirdCell<R>[] {
  if (!degrees) return cells
  let byKey = new Map(cells.map((c) => [`${c.x},${c.y}`, c]))
  let a = (-degrees * Math.PI) / 180
  let cos = Math.cos(a)
  let sin = Math.sin(a)
  let out: BirdCell<R>[] = []
  for (let y = -20; y <= 70; y++) {
    for (let x = -30; x <= 70; x++) {
      let dx = x - center.x
      let dy = y - center.y
      let src = byKey.get(`${Math.round(center.x + dx * cos - dy * sin)},${Math.round(center.y + dx * sin + dy * cos)}`)
      if (src) out.push({ ...src, x, y })
    }
  }
  return out
}

/**
 * The bird with its wings turned `degrees` around the shoulder, and pulled in
 * by `reach` (foreshortening as the wing sweeps past the body).
 */
export function flapFrame<R>(cells: BirdCell<R>[], degrees: number, reach = 1): BirdCell<R>[] {
  let byKey = new Map(cells.map((c) => [`${c.x},${c.y}`, c]))
  // inverse rotation: wings sweep counter-clockwise on screen, up-left to down-left
  let a = (degrees * Math.PI) / 180
  let cos = Math.cos(a)
  let sin = Math.sin(a)
  let body = cells.filter((c) => !isWing(c.x, c.y))
  let wing: BirdCell<R>[] = []
  // every cell the turned wing could reach, mapped back to the resting wing
  for (let y = -40; y <= 60; y++) {
    for (let x = -30; x <= 40; x++) {
      let dx = (x - SHOULDER.x) / reach
      let dy = (y - SHOULDER.y) / reach
      let sx = Math.round(SHOULDER.x + dx * cos - dy * sin)
      let sy = Math.round(SHOULDER.y + dx * sin + dy * cos)
      let src = isWing(sx, sy) ? byKey.get(`${sx},${sy}`) : undefined
      if (src) wing.push({ x, y, role: src.role, wing: true })
    }
  }
  // drop specks the rotation leaves at the wing's edge
  let at = new Set(wing.map((c) => `${c.x},${c.y}`))
  wing = wing.filter((c) => {
    let n = 0
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && at.has(`${c.x + dx},${c.y + dy}`)) n++
    return n >= 2
  })
  // the wing passes in front of the body on the downstroke
  let taken = new Set(wing.map((c) => `${c.x},${c.y}`))
  return [...body.filter((c) => !taken.has(`${c.x},${c.y}`)), ...wing]
}
