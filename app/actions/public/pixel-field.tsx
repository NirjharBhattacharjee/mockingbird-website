import { clientEntry, ref, type Handle } from 'remix/component'

import { createPixelField } from './lib/pixel-field.ts'

interface PixelFieldProps {
  /** id of the element the pixel wordmark centers in */
  wordSlotId?: string
  /** id of the element the pixel bird centers in */
  birdSlotId?: string
  birdSrc?: string
  horizon?: number
  density?: number
}

// Paints a pixel canvas behind its parent element. The parent should be
// `relative` and is also where pointer movement is tracked.
export const PixelField = clientEntry(import.meta.url, function PixelField(handle: Handle<PixelFieldProps>) {
  return () => {
    let { wordSlotId, birdSlotId, birdSrc, horizon, density } = handle.props
    return (
      <span
        hidden
        mix={ref((node, signal) => {
          let host = node.parentElement
          if (!host) return
          createPixelField(host, {
            wordSlot: wordSlotId ? document.getElementById(wordSlotId) : null,
            birdSlot: birdSlotId ? document.getElementById(birdSlotId) : null,
            birdSrc,
            horizon,
            density,
            signal,
          })
        })}
      />
    )
  }
})
