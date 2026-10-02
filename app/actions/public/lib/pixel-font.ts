// A chunky 12-row pixel font with just the letters "mockingbird" needs.
// Rows 0-2 are ascenders, 3-9 the x-height, 10-11 descenders.

type Glyph = Record<number, string>

const GLYPHS: Record<string, Glyph> = {
  m: { 3: '.xxxxxxxx.', 4: 'xx..xx..xx', 5: 'xx..xx..xx', 6: 'xx..xx..xx', 7: 'xx..xx..xx', 8: 'xx..xx..xx', 9: 'xx..xx..xx' },
  o: { 3: '.xxxx.', 4: 'xx..xx', 5: 'xx..xx', 6: 'xx..xx', 7: 'xx..xx', 8: 'xx..xx', 9: '.xxxx.' },
  c: { 3: '.xxxxx', 4: 'xx....', 5: 'xx....', 6: 'xx....', 7: 'xx....', 8: 'xx....', 9: '.xxxxx' },
  k: { 0: 'xx....', 1: 'xx....', 2: 'xx....', 3: 'xx..xx', 4: 'xx.xx.', 5: 'xxxx..', 6: 'xxxx..', 7: 'xx.xx.', 8: 'xx..xx', 9: 'xx..xx' },
  i: { 1: 'xx', 3: 'xx', 4: 'xx', 5: 'xx', 6: 'xx', 7: 'xx', 8: 'xx', 9: 'xx' },
  n: { 3: 'xxxxx.', 4: 'xx..xx', 5: 'xx..xx', 6: 'xx..xx', 7: 'xx..xx', 8: 'xx..xx', 9: 'xx..xx' },
  g: { 3: '.xxxxx', 4: 'xx..xx', 5: 'xx..xx', 6: 'xx..xx', 7: 'xx..xx', 8: '.xxxxx', 9: '....xx', 10: '....xx', 11: 'xxxxx.' },
  b: { 0: 'xx....', 1: 'xx....', 2: 'xx....', 3: 'xxxxx.', 4: 'xx..xx', 5: 'xx..xx', 6: 'xx..xx', 7: 'xx..xx', 8: 'xx..xx', 9: 'xxxxx.' },
  r: { 3: 'xx.xxx', 4: 'xxx...', 5: 'xx....', 6: 'xx....', 7: 'xx....', 8: 'xx....', 9: 'xx....' },
  d: { 0: '....xx', 1: '....xx', 2: '....xx', 3: '.xxxxx', 4: 'xx..xx', 5: 'xx..xx', 6: 'xx..xx', 7: 'xx..xx', 8: 'xx..xx', 9: '.xxxxx' },
}

export const FONT_ROWS = 12
const LETTER_GAP = 2

export interface FontCell {
  x: number
  y: number
  letter: number
  band: 0 | 1 | 2 | 3
}

function widthOf(ch: string): number {
  return Object.values(GLYPHS[ch])[0].length
}

export function measure(word: string): number {
  return [...word].reduce((w, ch, i) => w + widthOf(ch) + (i ? LETTER_GAP : 0), 0)
}

/** Cells of `word` in grid units, origin top-left. */
export function layout(word: string): FontCell[] {
  let cells: FontCell[] = []
  let ox = 0
  ;[...word].forEach((ch, letter) => {
    for (let [row, line] of Object.entries(GLYPHS[ch])) {
      let y = Number(row)
      for (let x = 0; x < line.length; x++) {
        if (line[x] !== 'x') continue
        let band = (y <= 3 ? 0 : y <= 5 ? 1 : y <= 7 ? 2 : 3) as FontCell['band']
        cells.push({ x: ox + x, y, letter, band })
      }
    }
    ox += widthOf(ch) + LETTER_GAP
  })
  return cells
}
