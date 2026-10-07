import { clientEntry, on, type Handle } from 'remix/component'

import { cx, storage } from './lib/events.ts'

const dismissed = storage('mb-toast')

// The "try it" hint in the bottom right, like Omarchy's "Change the theme" toast.
// Hidden until hydrated so people who closed it never see it flash, and while
// you're past the hero, where it would sit on top of the content.
export const Toast = clientEntry(import.meta.url, function Toast(handle: Handle) {
  let open = false
  let inHero = true

  handle.queueTask(() => {
    open = dismissed.get() !== 'closed'
    handle.update()
    window.addEventListener(
      'scroll',
      () => {
        let next = scrollY < innerHeight * 0.4
        if (next === inHero) return
        inHero = next
        handle.update()
      },
      { passive: true, signal: handle.signal },
    )
  })

  return () =>
    open ? (
      <aside
        aria-label="Try it"
        class={cx(
          'fixed right-4 bottom-4 z-40 hidden w-72 border border-surface0 bg-mantle/95 p-4 text-[14px] shadow-2xl shadow-black/30 backdrop-blur sm:block',
          // not opacity: the rise animation holds that at 1
          !inHero && 'invisible',
        )}
        style={{ animation: 'hero-rise .3s ease-out both', animationDelay: '1.6s' }}
      >
        <div class="mb-1.5 flex items-center justify-between">
          <p class="flex items-center gap-2 font-bold text-text">
            <span aria-hidden="true" class="text-sky">
              ▣
            </span>
            Try it here
          </p>
          <button
            type="button"
            aria-label="Dismiss"
            class="px-1 text-overlay hover:text-text"
            mix={on('click', () => {
              open = false
              dismissed.set('closed')
              handle.update()
            })}
          >
            ×
          </button>
        </div>
        <p class="text-soft">
          Hold <kbd class="kbd py-0">F</kbd> to talk, like you would on your Mac. Press <kbd class="kbd py-0">T</kbd> to change the flavor,
          and <kbd class="kbd py-0">↑</kbd> <kbd class="kbd py-0">↓</kbd> to move between sections.
        </p>
      </aside>
    ) : null
})
