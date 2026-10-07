import { clientEntry, ref, type Handle } from 'remix/component'

import { createPixelField } from './lib/pixel-field.ts'

// Paints the page-wide pixel canvas behind the home page. Renders nothing
// itself: the canvas is fixed to the viewport.
export const PixelField = clientEntry(import.meta.url, function PixelField(handle: Handle<{ birdSrc?: string }>) {
  return () => <span hidden mix={ref((_node, signal) => createPixelField({ birdSrc: handle.props.birdSrc, signal }))} />
})
