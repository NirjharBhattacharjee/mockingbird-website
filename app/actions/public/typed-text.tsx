import { clientEntry, type Handle } from 'remix/component'

import { prefersReducedMotion, wait } from './lib/events.ts'

interface TypedTextProps {
  phrases: string[]
}

// Types each phrase, holds it, then deletes back to the prefix it shares with
// the next one. Server-renders the first phrase so there is no empty gap.
export const TypedText = clientEntry(import.meta.url, function TypedText(handle: Handle<TypedTextProps>) {
  let shown = handle.props.phrases[0] ?? ''

  handle.queueTask(async () => {
    let { phrases } = handle.props
    if (prefersReducedMotion() || phrases.length < 2) return
    let signal = handle.signal
    let i = 0
    await wait(2200)
    while (!signal.aborted) {
      i = (i + 1) % phrases.length
      let next = phrases[i]
      let keep = 0
      while (keep < shown.length && keep < next.length && shown[keep] === next[keep]) keep++
      while (shown.length > keep && !signal.aborted) {
        shown = shown.slice(0, -1)
        handle.update()
        await wait(28)
      }
      for (let ch of next.slice(keep)) {
        if (signal.aborted) return
        shown += ch
        handle.update()
        await wait(55 + Math.random() * 40)
      }
      await wait(2000)
    }
  })

  return () => (
    <span>
      <span class="sr-only">{handle.props.phrases[0]}</span>
      <span aria-hidden="true">{shown}</span>
      <span aria-hidden="true" class="caret caret-thin" />
    </span>
  )
})
