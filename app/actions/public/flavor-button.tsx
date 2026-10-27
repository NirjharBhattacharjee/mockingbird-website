import { clientEntry, on, type Handle } from 'remix/component'

import { THEME_EVENT, cx, isPageShortcut, prefersReducedMotion, storage } from './lib/events.ts'
import { musicPlaying, startMusic, stopMusic } from './lib/spooky-music.ts'

type Flavor = 'mocha' | 'macchiato' | 'frappe' | 'latte' | 'halloween'
const FLAVORS: Flavor[] = ['mocha', 'macchiato', 'frappe', 'latte']
const LABELS: Record<Flavor, string> = { mocha: 'Mocha', macchiato: 'Macchiato', frappe: 'Frappé', latte: 'Latte', halloween: 'Halloween' }
// Seasonal: Halloween is the default and leads the cycle through October 31,
// then drops out (same date in public/theme-init.js). Delete it,
// lib/spooky-music.ts and its CSS after that.
if (new Date() < new Date(2026, 10, 1)) FLAVORS.unshift('halloween')
const saved = storage('mb-flavor')

function currentFlavor(): Flavor {
  let f = document.documentElement.dataset.flavor as Flavor | undefined
  return f && FLAVORS.includes(f) ? f : 'mocha'
}

// Cycles the Catppuccin flavor. Also owns the page-wide letter shortcuts: T
// for the flavor, M for the Halloween music, and the nav links marked with
// data-key ("[g] guide").
export const FlavorButton = clientEntry(import.meta.url, function FlavorButton(handle: Handle) {
  let flavor: Flavor = 'mocha'

  function apply(next: Flavor) {
    // Track the target right away: the DOM only changes once the transition
    // callback runs, and a quick second press must build on this one.
    flavor = next
    // switching is a click or key press, so the browser lets the music start
    if (next === 'halloween') startMusic()
    else stopMusic()
    let commit = () => {
      document.documentElement.dataset.flavor = next
      saved.set(next)
      window.dispatchEvent(new Event(THEME_EVENT))
      handle.update()
    }
    if (!document.startViewTransition || prefersReducedMotion()) return commit()
    // Pressing T quickly skips the previous transition, which rejects its
    // promises. That's expected, so don't let it surface as an error.
    let transition = document.startViewTransition(commit)
    transition.ready.catch(() => {})
    transition.finished.catch(() => {})
  }

  function cycle() {
    apply(FLAVORS[(FLAVORS.indexOf(flavor) + 1) % FLAVORS.length])
  }

  function toggleMusic() {
    if (flavor !== 'halloween') return
    if (musicPlaying()) stopMusic()
    else startMusic()
    handle.update()
  }

  handle.queueTask(() => {
    flavor = currentFlavor()
    handle.update()
    window.addEventListener(
      'keydown',
      (e) => {
        if (e.repeat || !isPageShortcut(e)) return
        let key = e.key.toLowerCase()
        if (key === 't') return cycle()
        if (key === 'm') return toggleMusic()
        document.querySelector<HTMLElement>(`[data-key="${CSS.escape(key)}"]`)?.click()
      },
      { signal: handle.signal },
    )
  })

  return () => (
    <span class="flex items-center gap-2">
      {flavor === 'halloween' && (
        <button
          type="button"
          title="Spooky music (M)"
          class="chip"
          aria-keyshortcuts="m"
          aria-pressed={musicPlaying()}
          mix={on('click', toggleMusic)}
        >
          {/* phones get a lone ♪ (struck through when off), so the nav fits at 320px */}
          <span aria-hidden="true" class="text-sky max-sm:hidden">
            [m]
          </span>
          <span class="max-sm:sr-only">music</span>
          <span aria-hidden="true" class="max-sm:hidden">
            {musicPlaying() ? 'on' : 'off'}
          </span>
          <span aria-hidden="true" class={cx('sm:hidden', musicPlaying() ? 'text-sky' : 'line-through opacity-50')}>
            ♪
          </span>
        </button>
      )}
      <button type="button" title="Change the flavor (T)" class="chip" aria-keyshortcuts="t" mix={on('click', cycle)}>
        <span aria-hidden="true" class={cx('text-sky', flavor === 'halloween' && 'max-sm:hidden')}>
          [t]
        </span>
        <span aria-hidden="true" class="grid grid-cols-2 gap-px">
          <i class="block size-[5px] bg-sky" />
          <i class="block size-[5px] bg-mauve" />
          <i class="block size-[5px] bg-peach" />
          <i class="block size-[5px] bg-green" />
        </span>
        <span>{LABELS[flavor].toLowerCase()}</span>
      </button>
    </span>
  )
})
