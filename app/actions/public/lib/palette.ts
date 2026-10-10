// Reads the active Catppuccin flavor from CSS custom properties and derives
// the ramp the pixel canvas draws with: dim → mid → lit → crest.

export type RGB = [number, number, number]

/** Colors a shape's cells can take. */
export type Role = 'sky' | 'teal' | 'tealDeep' | 'blue' | 'mauve' | 'lavender' | 'peach' | 'green' | 'yellow' | 'red' | 'mid'

export interface Palette extends Record<Role, RGB> {
  light: boolean
  bg: RGB
  text: RGB
  dim: RGB
  lit: RGB
  crest: RGB
}

export function hex(value: string): RGB {
  let h = value.replace('#', '').trim()
  return [0, 2, 4].map((i) => Number.parseInt(h.slice(i, i + 2), 16)) as RGB
}

export function mix(a: RGB, b: RGB, t: number): RGB {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t)) as RGB
}

export function rgb([r, g, b]: RGB): string {
  return `rgb(${r} ${g} ${b})`
}

/** The wordmark's four bands, top to bottom, tinted with `accent`. */
export function bands(p: Palette, accent: RGB): [RGB, RGB, RGB, RGB] {
  let crest = mix(accent, p.light ? p.text : [255, 255, 255], p.light ? 0.45 : 0.62)
  return [crest, mix(crest, accent, 0.5), accent, mix(accent, p.bg, 0.42)]
}

export function readPalette(): Palette {
  let styles = getComputedStyle(document.documentElement)
  let get = (name: string) => hex(styles.getPropertyValue(name))
  let bg = get('--crust')
  let sky = get('--sky')
  let teal = get('--teal')
  let text = get('--text')
  let light = bg[0] + bg[1] + bg[2] > 384
  return {
    light,
    bg,
    text,
    dim: mix(sky, bg, light ? 0.8 : 0.78),
    mid: mix(sky, bg, 0.55),
    lit: sky,
    crest: mix(sky, light ? text : [255, 255, 255], light ? 0.45 : 0.62),
    sky,
    teal,
    tealDeep: mix(teal, bg, 0.28),
    blue: get('--blue'),
    mauve: get('--mauve'),
    lavender: get('--lavender'),
    peach: get('--peach'),
    green: get('--green'),
    yellow: get('--yellow'),
    red: get('--red'),
  }
}
