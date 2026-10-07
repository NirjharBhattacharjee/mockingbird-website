import { clientEntry, on, type Handle } from 'remix/component'

import { type TalkState, cx, emitTalk, isPageShortcut, prefersReducedMotion, wait } from './lib/events.ts'

// Scripted, so the page never asks for the microphone. Each sample shows what
// Whisper hears (raw) and what the cleanup model types (clean).
const SAMPLES = [
  {
    raw: 'um so ship the uh release notes after lunch and and ping priya about the onboarding copy',
    clean: 'Ship the release notes after lunch, and ping Priya about the onboarding copy.',
  },
  {
    raw: 'okay groceries we need eggs uh spinach oat milk and the the good coffee',
    clean: 'Groceries:\n- eggs\n- spinach\n- oat milk\n- the good coffee',
  },
  {
    raw: 'hey can we move standup to ten thirty tomorrow i have a dentist thing at nine',
    clean: 'Hey, can we move standup to 10:30 tomorrow? I have a dentist appointment at 9.',
  },
]

const METER_BARS = 28

// Owns the page-wide "hold F to talk" shortcut and the demo terminal.
export const TalkDemo = clientEntry(import.meta.url, function TalkDemo(handle: Handle) {
  let state: TalkState = 'idle'
  let sample = 0
  let raw = ''
  let clean = ''
  let job = 0

  function set(next: TalkState) {
    state = next
    emitTalk(next)
    handle.update()
  }

  async function typeOut(text: string, ms: number, write: (s: string) => void, myJob: number) {
    let out = ''
    for (let ch of text) {
      if (myJob !== job) return false
      out += ch
      write(out)
      handle.update()
      if (!prefersReducedMotion()) await wait(ms)
    }
    return true
  }

  function start() {
    if (state === 'listening') return
    let myJob = ++job
    raw = ''
    clean = ''
    set('listening')
    typeOut(SAMPLES[sample].raw, 38, (s) => (raw = s), myJob)
  }

  async function stop() {
    if (state !== 'listening') return
    let myJob = ++job
    let s = SAMPLES[sample]
    raw = s.raw
    set('transcribing')
    await wait(prefersReducedMotion() ? 0 : 420)
    if (myJob !== job) return
    set('typed')
    let done = await typeOut(s.clean, 16, (out) => (clean = out), myJob)
    if (!done) return
    sample = (sample + 1) % SAMPLES.length
    await wait(2600)
    if (myJob === job) set('idle')
  }

  handle.queueTask(() => {
    let signal = handle.signal
    window.addEventListener(
      'keydown',
      (e) => {
        if (!isPageShortcut(e)) return
        if (e.key !== 'f' && e.key !== 'F') return
        e.preventDefault()
        if (!e.repeat) start()
      },
      { signal },
    )
    window.addEventListener(
      'keyup',
      (e) => {
        if (e.key === 'f' || e.key === 'F') stop()
      },
      { signal },
    )
    window.addEventListener('blur', () => stop(), { signal })
  })

  return () => {
    let listening = state === 'listening'
    return (
      <div class="card overflow-hidden" data-state={state}>
        <div class="flex items-center gap-2 border-b border-surface0 bg-mantle px-3 py-2">
          <i class="block size-2.5 bg-red" />
          <i class="block size-2.5 bg-yellow" />
          <i class="block size-2.5 bg-green" />
          <span class="ml-2 text-[12px] text-overlay">~ — mockingbird listen</span>
          <span class="ml-auto text-[11px] text-overlay">simulated · no microphone</span>
        </div>

        <div class="space-y-3 p-4 sm:p-5">
          <p>
            <span class="text-green">$</span> mockingbird listen
          </p>

          <div class="flex items-end gap-3">
            <span class={cx('w-28 shrink-0 text-[12px]', listening ? 'text-red' : 'text-overlay')}>
              {listening ? '● recording' : state === 'transcribing' ? '◐ transcribing' : '○ hold F'}
            </span>
            <div aria-hidden="true" class="flex h-6 items-end gap-[3px]">
              {Array.from({ length: METER_BARS }, (_, i) => (
                <i
                  class={cx('meter-bar block h-6 w-[5px]', i % 4 === 0 ? 'bg-mauve' : 'bg-sky')}
                  style={{ '--i': String(i % 7) } as Record<string, string>}
                />
              ))}
            </div>
          </div>

          <dl class="grid grid-cols-[4.5rem_1fr] gap-x-3 gap-y-2 text-[13px]">
            <dt class="text-overlay">raw</dt>
            <dd class="min-h-[1.6em] text-subtle italic">
              {raw}
              {listening && <span class="caret" />}
            </dd>
            <dt class="text-sky">clean</dt>
            <dd class="min-h-[1.6em] whitespace-pre-line text-text">
              {clean}
              {state === 'typed' && <span class="caret" />}
            </dd>
          </dl>
        </div>

        <div class="flex flex-wrap items-center gap-3 border-t border-surface0 px-4 py-3 sm:px-5">
          <button
            type="button"
            class={cx(listening ? 'btn bg-red text-ink' : 'btn-primary', 'touch-none select-none')}
            mix={[
              on('pointerdown', (e) => {
                ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
                start()
              }),
              on('pointerup', () => stop()),
              on('pointercancel', () => stop()),
            ]}
          >
            <span aria-hidden="true">{listening ? '●' : '◉'}</span>
            <span>{listening ? 'Listening… let go to type' : 'Press and hold to talk'}</span>
          </button>
          <span class="text-[12px] text-overlay">
            or hold <kbd class="kbd">F</kbd> anywhere on this page
          </span>
        </div>
      </div>
    )
  }
})
