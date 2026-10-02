import { clientEntry, on, type Handle } from 'remix/component'

import { THEME_EVENT, isTypingTarget, prefersReducedMotion, storage } from './lib/events.ts'

const FLAVORS = ['mocha', 'macchiato', 'frappe', 'latte'] as const
type Flavor = (typeof FLAVORS)[number]
const LABELS: Record<Flavor, string> = { mocha: 'Mocha', macchiato: 'Macchiato', frappe: 'Frappé', latte: 'Latte' }
const saved = storage('mb-flavor')

function currentFlavor(): Flavor {
  let f = document.documentElement.dataset.flavor as Flavor | undefined
  return f && FLAVORS.includes(f) ? f : 'mocha'
}

// Cycles the Catppuccin flavor. Also owns the page-wide T shortcut.
export const FlavorButton = clientEntry(import.meta.url, function FlavorButton(handle: Handle) {
  let flavor: Flavor = 'mocha'

  function apply(next: Flavor) {
    // Track the target right away: the DOM only changes once the transition
    // callback runs, and a quick second press must build on this one.
    flavor = next
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

  handle.queueTask(() => {
    flavor = currentFlavor()
    handle.update()
    window.addEventListener(
      'keydown',
      (e) => {
        if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return
        if (e.key === 't' || e.key === 'T') cycle()
      },
      { signal: handle.signal },
    )
  })

  return () => (
    <button
      type="button"
      title="Change the flavor (T)"
      class="flex items-center gap-2 px-2 py-1.5 text-soft hover:text-text"
      mix={on('click', cycle)}
    >
      <span aria-hidden="true" class="grid grid-cols-2 gap-px">
        <i class="block size-[5px] bg-sky" />
        <i class="block size-[5px] bg-mauve" />
        <i class="block size-[5px] bg-peach" />
        <i class="block size-[5px] bg-green" />
      </span>
      <span class="text-[12px]">{LABELS[flavor]}</span>
    </button>
  )
})
