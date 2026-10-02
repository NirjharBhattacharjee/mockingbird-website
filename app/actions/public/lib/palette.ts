// Reads the active Catppuccin flavor from CSS custom properties and derives
// the ramp the pixel canvases draw with: dim → mid → lit → crest.

export type RGB = [number, number, number]

export interface Palette {
  light: boolean
  bg: RGB
  dim: RGB
  mid: RGB
  lit: RGB
  crest: RGB
  /** wordmark bands, top to bottom */
  bands: [RGB, RGB, RGB, RGB]
  sky: RGB
  teal: RGB
  tealDeep: RGB
  blue: RGB
  mauve: RGB
}

export type BirdRole = 'sky' | 'teal' | 'tealDeep' | 'blue' | 'mauve'

function hex(value: string): RGB {
  let h = value.replace('#', '').trim()
  return [0, 2, 4].map((i) => Number.parseInt(h.slice(i, i + 2), 16)) as RGB
}

export function mix(a: RGB, b: RGB, t: number): RGB {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t)) as RGB
}

export function rgb([r, g, b]: RGB): string {
  return `rgb(${r} ${g} ${b})`
}

export function readPalette(): Palette {
  let styles = getComputedStyle(document.documentElement)
  let get = (name: string) => hex(styles.getPropertyValue(name))
  let bg = get('--crust')
  let sky = get('--sky')
  let teal = get('--teal')
  let light = bg[0] + bg[1] + bg[2] > 384
  let crest = mix(sky, light ? get('--text') : [255, 255, 255], light ? 0.45 : 0.62)
  return {
    light,
    bg,
    dim: mix(sky, bg, light ? 0.8 : 0.78),
    mid: mix(sky, bg, 0.55),
    lit: sky,
    crest,
    bands: [crest, mix(crest, sky, 0.5), sky, mix(sky, bg, 0.42)],
    sky,
    teal,
    tealDeep: mix(teal, bg, 0.28),
    blue: get('--blue'),
    mauve: get('--mauve'),
  }
}
