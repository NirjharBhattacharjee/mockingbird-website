import { clientEntry, on, type Handle } from 'remix/component'

import { wait } from './lib/events.ts'

interface CopyButtonProps {
  text: string
  label?: string
}

export const CopyButton = clientEntry(import.meta.url, function CopyButton(handle: Handle<CopyButtonProps>) {
  let state: 'idle' | 'copied' | 'failed' = 'idle'

  return () => (
    <button
      type="button"
      class="btn-primary shrink-0"
      mix={on('click', async (_event, signal) => {
        try {
          await navigator.clipboard.writeText(handle.props.text)
          state = 'copied'
        } catch {
          state = 'failed'
        }
        await handle.update()
        await wait(1200)
        if (signal.aborted) return
        state = 'idle'
        handle.update()
      })}
    >
      <span aria-hidden="true">{state === 'copied' ? '✓' : '⧉'}</span>
      <span>{state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : (handle.props.label ?? 'Copy')}</span>
    </button>
  )
})
