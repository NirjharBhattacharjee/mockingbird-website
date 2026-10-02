import { clientEntry, type Handle } from 'remix/component'

import { type TalkState, cx, onTalk } from './lib/events.ts'

const LINES: Record<TalkState, [string, string]> = {
  idle: ['idle', 'hold F to talk'],
  listening: ['listening…', 'let go to type'],
  transcribing: ['transcribing…', 'on this Mac, offline'],
  typed: ['typed at your cursor', 'nothing left the machine'],
}

// Bottom-left status, mockingbird's take on Omarchy's now-playing widget.
export const StatusWidget = clientEntry(import.meta.url, function StatusWidget(handle: Handle) {
  let state: TalkState = 'idle'

  handle.queueTask(() => {
    onTalk((next) => {
      state = next
      handle.update()
    }, handle.signal)
  })

  return () => {
    let [title, sub] = LINES[state]
    let dot = state === 'listening' ? 'bg-red' : state === 'idle' ? 'bg-overlay' : 'bg-green'
    return (
      <div
        role="status"
        aria-live="polite"
        class="fixed bottom-4 left-4 z-40 hidden items-center gap-3 border border-surface0 bg-mantle/95 py-2 pr-4 pl-2 text-[11px] backdrop-blur md:flex"
      >
        <img src="/brand/logo.png" alt="" width="22" height="28" class="pixelated h-7 w-auto" />
        <div class="leading-tight">
          <p class="flex items-center gap-1.5 text-text">
            <i class={cx('block size-1.5', dot, state === 'listening' ? 'animate-pulse' : '')} />
            mockingbird · {title}
          </p>
          <p class="text-overlay">{sub}</p>
        </div>
      </div>
    )
  }
})
