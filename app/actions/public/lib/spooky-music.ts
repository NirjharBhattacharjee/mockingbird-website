// The Halloween flavor's music, synthesized with Web Audio: no audio files,
// nothing fetched. A music box plays minor arpeggios through an echo, over a
// low drone, while a theremin wails a slow tune. It only starts from a click
// or key press (browsers block audio before one anyway).
// Seasonal: delete with the rest of the Halloween flavor after October 31.

const STEP = 0.32 // seconds per music box note
// Dm, B♭, Gm, A: the bar's chord tones (MIDI), the music box climbs and falls through them
const CHORDS = [
  [62, 65, 69, 74],
  [58, 62, 65, 70],
  [55, 58, 62, 67],
  [57, 61, 64, 69],
]
const PATTERN = [0, 1, 2, 3, 2, 1, 2, 1]
// the theremin's note for each bar
const TUNE = [69, 70, 67, 73]

let ctx: AudioContext | undefined
let out: GainNode | undefined
let timer: ReturnType<typeof setInterval> | undefined

const freq = (midi: number) => 440 * 2 ** ((midi - 69) / 12)

export function musicPlaying() {
  return ctx !== undefined
}

export function startMusic() {
  if (ctx) return
  let c = (ctx = new AudioContext())
  let now = c.currentTime

  let master = (out = c.createGain())
  master.gain.setValueAtTime(0, now)
  master.gain.setTargetAtTime(0.6, now, 0.6)
  master.connect(c.destination)

  // echo for the music box
  let echo = c.createDelay()
  echo.delayTime.value = STEP * 1.5
  let feedback = c.createGain()
  feedback.gain.value = 0.35
  echo.connect(feedback).connect(echo)
  echo.connect(master)

  // two detuned low Ds, beating slowly against each other
  let drone = c.createBiquadFilter()
  drone.type = 'lowpass'
  drone.frequency.value = 220
  let droneGain = c.createGain()
  droneGain.gain.value = 0.06
  drone.connect(droneGain).connect(master)
  for (let detune of [-7, 7]) {
    let o = c.createOscillator()
    o.type = 'sawtooth'
    o.frequency.value = freq(38)
    o.detune.value = detune
    o.connect(drone)
    o.start(now)
  }

  // the theremin: a sine with vibrato that glides between notes
  let theremin = c.createOscillator()
  theremin.frequency.value = freq(TUNE[0])
  let vibrato = c.createOscillator()
  vibrato.frequency.value = 5.5
  let depth = c.createGain()
  depth.gain.value = 9
  vibrato.connect(depth).connect(theremin.frequency)
  let voice = c.createGain()
  voice.gain.value = 0
  theremin.connect(voice).connect(master)
  theremin.start(now)
  vibrato.start(now)

  function pluck(midi: number, at: number) {
    let o = c.createOscillator()
    o.type = 'triangle'
    o.frequency.value = freq(midi)
    let g = c.createGain()
    g.gain.setValueAtTime(0.14, at)
    g.gain.exponentialRampToValueAtTime(0.001, at + 1.4)
    o.connect(g)
    g.connect(master)
    g.connect(echo)
    o.start(at)
    o.stop(at + 1.5)
  }

  let step = 0
  let next = now + 0.1
  // schedule half a second ahead, so timer jitter never makes a note late
  let tick = () => {
    while (next < c.currentTime + 0.5) {
      let bar = (step >> 3) % CHORDS.length
      pluck(CHORDS[bar][PATTERN[step % 8]] + 12, next)
      if (step % 8 === 0) {
        theremin.frequency.setTargetAtTime(freq(TUNE[bar]), next, 0.12)
        voice.gain.setTargetAtTime(0.09, next, 0.4)
        voice.gain.setTargetAtTime(0.015, next + STEP * 5, 0.5)
      }
      next += STEP
      step++
    }
  }
  tick()
  timer = setInterval(tick, 100)
}

export function stopMusic() {
  if (!ctx) return
  let c = ctx
  ctx = undefined
  clearInterval(timer)
  // a short fade, so it doesn't click
  out?.gain.setTargetAtTime(0, c.currentTime, 0.08)
  setTimeout(() => c.close(), 400)
}
