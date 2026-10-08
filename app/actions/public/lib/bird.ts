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
