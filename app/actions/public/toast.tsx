import { clientEntry, on, type Handle } from 'remix/component'

import { storage } from './lib/events.ts'

const dismissed = storage('mb-toast')

// The "try it" hint in the top right, like Omarchy's "Change the theme" toast.
// Hidden until hydrated so people who closed it never see it flash.
export const Toast = clientEntry(import.meta.url, function Toast(handle: Handle) {
  let open = false

  handle.queueTask(() => {
    open = dismissed.get() !== 'closed'
    handle.update()
  })

  return () =>
    open ? (
      <aside
        aria-label="Try it"
        class="fixed top-16 right-4 z-40 hidden w-64 border border-surface0 bg-mantle/95 p-3.5 text-[12px] shadow-2xl shadow-black/30 backdrop-blur sm:block"
        style={{ animation: 'hero-rise .3s ease-out both', animationDelay: '1.6s' }}
      >
        <div class="mb-1.5 flex items-center justify-between">
          <p class="flex items-center gap-2 font-medium text-text">
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
          Hold <kbd class="kbd py-0 text-[11px]">F</kbd> to talk, like you would on your Mac. Press <kbd class="kbd py-0 text-[11px]">T</kbd> to change the
          flavor.
        </p>
      </aside>
    ) : null
})
